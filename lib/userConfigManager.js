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
    this.gymLookupOptionsByParent = {};
    this.normalized = {
        userName: Utils.normalize(init.userName),
        gymLookupOptions: GymDirectory.getOptions(this.gymLookupOptions),
    };
};

UserConfig.prototype.getOptionsAsConfigured = function () { return this.gymLookupOptions; };
UserConfig.prototype.getEffectiveOptions = function (parent) {
    if (parent) {
        if (!this.gymLookupOptionsByParent.hasOwnProperty(parent.key)) {
            const merged = GymDirectory.mergeOptions(parent.getEffectiveOptions(), this.gymLookupOptions);
            this.gymLookupOptionsByParent[parent.key] = merged;
        }
        return this.gymLookupOptionsByParent[parent.key];
    }
    return this.normalized.gymLookupOptions;
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

var UserConfigManager = function (init, options) {
    let self = this;
    options = options || {};

    self.users = {};
    self.logger = options.logger || console;

    self.autosavePath = (typeof init === "string") ? path.resolve(init) : null;
    self.dirty = false;

    if (self.autosavePath) {
        self.tryRestoreFromFile(self.autosavePath);
    }
    else if (init) {
        Utils.forOwn(init, (u) => this.addUser(u));
    }

    if (self.autosavePath) {
        let refresh = (options.refresh !== undefined) ? options.refresh : 30;
        if (refresh > 0) {
            setInterval(() => self.autoSave(), refresh * 1000);
        }
    }
};

UserConfigManager.prototype.addUser = function (userInit) {
    if (this.users.hasOwnProperty(userInit.id)) {
        throw new Error(`User ID "${userInit.id}" multiply defined.`);
    }

    this.users[userInit.id] = new UserConfig(userInit);
    this.dirty = true;
    return this.users[userInit.id];
};

UserConfigManager.prototype.addOrUpdateUser = function (userInit) {
    this.users[userInit.id] = new UserConfig(userInit);
    this.dirty = true;
    return this.users[userInit.id];
};

UserConfigManager.prototype.tryGetUser = function (userId) {
    return this.users[userId];
};

UserConfigManager.prototype.getEffectiveOptions = function (userId, channel) {
    let channelConfig = channel.getEffectiveOptions();
    let userConfig = this.users[userId];
    if (channelConfig) {
        return userConfig ? GymDirectory.mergeOptions(channelConfig, userConfig) : channelConfig;
    }
    return userConfig;
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
            saveObject.users.forEach((u) => this.addUser(UserConfig.restore(u)));
            this.dirty = false;
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
    let succeeded = false;
    try {
        let stateToSave = JSON.stringify(this.getSaveObject());
        fs.writeFile(path, stateToSave, { encoding: "utf8", flag: "w" });
        succeeded = true;
    }
    catch (e) {
        if (this.logger) {
            this.logger.log(`Error restoring user configs: ${e}`);
        }
    }
    return succeeded;
};

UserConfigManager.prototype.autoSave = function () {
    if (this.dirty && this.autosavePath) {
        let succeeded = this.saveToFile(this.autosavePath);
        this.dirty = !succeeded;
    }
};

module.exports = UserConfigManager;
