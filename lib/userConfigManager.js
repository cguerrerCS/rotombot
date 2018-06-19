"use strict";

const path = require("path");
const fs = require("fs");
const GymDirectory = require("./gymDirectory");
const Utils = require("./utils");

var UserConfig = function (init) {
    if ((!init.id) || (typeof init.id !== "string") || (init.id.trim().length < 1)) {
        throw new Error(`User ID "${init.id}" must be a non-empty string.`);
    }

    if ((!init.userName) || (typeof init.userName !== "string") || (init.userName.trim().length < 1)) {
        throw new Error(`User Name "${init.userName}" must be a non-empty string.`);
    }

    if (init.gymLookupOptions !== undefined) {
        GymDirectory.validateOptions(init.gymLookupOptions);
    }

    this.id = init.id;
    this.userName = init.userName;
    this.gymLookupOptions = init.gymLookupOptions || {};
    this.gymLookupOptionsByServer = {};
    this.normalized = {
        userName: Utils.normalize(init.userName),
    };
};

UserConfig.prototype.getUserOptionsAsConfigured = function () { return this.gymLookupOptions; };
UserConfig.prototype.getEffectiveUserOptionsForServer = function (server) {
    if (!this.gymLookupOptionsByServer.hasOwnProperty(server.key)) {
        const merged = GymDirectory.mergeOptions(server.getEffectiveServerOptions(), this.gymLookupOptions);
        this.gymLookupOptionsByServer[server.key] = merged;
    }
    return this.gymLookupOptionsByServer[server.key];
};

UserConfig.prototype.getSaveObject = function () {
    return {
        id: this.id,
        userName: this.userName,
        gymLookupOptions: this.gymLookupOptions,
    };
};

UserConfig.restore = function (saveObject) {
    return new UserConfig(saveObject);
};

var UserConfigManager = function (init) {
    this.users = {};
    this.logger = console;
    this.autosavePaused = false;

    this.autosavePath = (typeof init === "string") ? path.resolve(init) : null;
    this.pauseAutoSave(() => {
        if (this.autosavePath) {
            this.tryRestoreFromFile(this.autosavePath)
        }
        else if (init) {
            Utils.forOwn(init, (u) => this.addUser(u));
        }
    });
};

UserConfigManager.prototype.addUser = function (userInit) {
    if (this.users.hasOwnProperty(userInit.id)) {
        throw new Error(`User ID "${userInit.id}" multiply defined.`);
    }

    this.users[userInit.id] = new UserConfig(userInit);
    this.autoSave();
    return this.users[userInit.id];
};

UserConfigManager.prototype.addOrUpdateUser = function (userInit) {
    this.users[userInit.id] = new UserConfig(userInit);
    this.autoSave();
    return this.users[userInit.id];
};

UserConfigManager.prototype.getUser = function (userId) {
    return this.users[userId];
};

UserConfigManager.prototype.forEachUser = function (func) {
    Utils.forOwn(this.users, func);
};

UserConfigManager.prototype.getUsersByName = function (name) {
    let normalized = Utils.normalize(name);
    let users = [];

    this.forEachUser((user) => {
        if (normalized === user.normalized.userName) {
            users.push(user);
        }
    });

    return users;
};

UserConfigManager.prototype.getSaveObject = function () {
    let users = [];

    this.forEachUser((user) => {
        users.push(user.getSaveObject());
    });

    return {
        users: users,
    };
};

UserConfigManager.prototype.restorefromSaveState = function (saveObject) {
    if (saveObject) {
        if (saveObject.users) {
            this.pauseAutoSave(() => {
                saveObject.users.forEach((u) => this.addUser(UserConfig.restore(u)));
            });
            return true;
        }
        throw new Error("Invalid save object in UserConfigManager.restore.");
    }
    return false;
};

UserConfigManager.restore = function (saveObject) {
    let configs =  new UserConfigManager();
    configs.restorefromSaveState(saveObject);
    return configs;
};

UserConfigManager.prototype.tryRestoreFromFile = function (path) {
    try {
        if (fs.exists(path)) {
            this.restorefromSaveState(JSON.parse(fs.readFileSync(path, "utf8")));
        }
    }
    catch (e) {
        if (this.logger) {
            this.logger.log(`Error restoring user configs: ${e}`);
        }
    }
};

UserConfigManager.prototype.saveToFile = function (path) {
    try {
        let stateToSave = JSON.stringify(this.getSaveObject());
        fs.writeFile(path, stateToSave, { encoding: "utf8", flag: "w" });
    }
    catch (e) {
        if (this.logger) {
            this.logger.log(`Error restoring user configs: ${e}`);
        }
    }
};

UserConfigManager.prototype.autoSave = function () {
    if (this.autosavePath && !this.autosavePaused) {
        this.saveToFile(this.autosavePath);
    }
};

UserConfigManager.prototype.pauseAutoSave = function (func) {
    this.autosavePaused = true;
    func();
    this.autosavePaused = false;
};

module.exports = UserConfigManager;
