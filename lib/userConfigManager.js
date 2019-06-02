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

UserConfig.prototype.getGymLookupOptionsAsConfigured = function () { return this.gymLookupOptions; };
UserConfig.prototype.getEffectiveGymLookupOptions = function (parent) {
    if (parent) {
        if (!this.gymLookupOptionsByParent.hasOwnProperty(parent.key)) {
            const merged = GymDirectory.mergeOptions(parent.getEffectiveGymLookupOptions(), this.gymLookupOptions);
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
        Utils.forOwn(init, (u) => this.addUserConfig(u));
    }

    if (self.autosavePath) {
        let refresh = (options.refresh !== undefined) ? options.refresh : 30;
        if (refresh > 0) {
            setInterval(() => self.autoSave(), refresh * 1000);
        }
    }
};

UserConfigManager.prototype.addUserConfig = function (userInit) {
    if (this.users.hasOwnProperty(userInit.id)) {
        throw new Error(`User ID "${userInit.id}" multiply defined.`);
    }

    this.users[userInit.id] = new UserConfig(userInit);
    this.dirty = true;
    return this.users[userInit.id];
};

UserConfigManager.prototype.addOrUpdateUserConfig = function (userInit) {
    this.users[userInit.id] = new UserConfig(userInit);
    this.dirty = true;
    return this.users[userInit.id];
};

UserConfigManager.prototype.tryGetUserConfig = function (userId) {
    return this.users[userId];
};

UserConfigManager.prototype.getEffectiveGymLookupOptions = function (userId, parent) {
    if (this.users[userId]) {
        return this.users[userId].getEffectiveGymLookupOptions(parent);
    }
    else if (parent) {
        return parent.getEffectiveGymLookupOptions();
    }
    return undefined;
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
            saveObject.users.forEach((u) => this.addUserConfig(UserConfig.restore(u)));
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
        if (fs.existsSync(path)) {
            this.restorefromSaveState(JSON.parse(fs.readFileSync(path, "utf8")));
        }
        else if (this.logger) {
            this.logger.log(`User state not restored: "${path}" does not exist.`);
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
        fs.writeFileSync(path, stateToSave, { encoding: "utf8", flag: "w" });
        succeeded = true;
        if (this.logger) {
            this.logger.log(`User configs saved to ${path}.`);
        }
    }
    catch (e) {
        if (this.logger) {
            this.logger.log(`Error saving user configs: ${e}`);
        }
    }
    return succeeded;
};

UserConfigManager.prototype.autoSave = function () {
    if (this.autosavePath) {
        if (this.dirty) {
            let succeeded = this.saveToFile(this.autosavePath);
            this.dirty = !succeeded;
        }
        else if (this.logger) {
            this.logger.log("No changes to user configs.");
        }
    }
    else {
        this.logger.log("No autosave path for user configs.");
    }
};

module.exports = UserConfigManager;
