"use strict";

const fs = require("fs");
const path = require("path");
const Utils = require("./utils");
const GymDirectory = require("./gymDirectory");

var ServerConfig = function (init) {
    if ((!init.id) || (typeof init.id !== "string") || (init.id.trim().length < 1)) {
        throw new Error(`Server ID "${init.id}" must be a non-empty string.`);
    }

    if ((!init.displayName) || (typeof init.displayName !== "string") || (init.displayName.trim().length < 1)) {
        throw new Error(`Server display name "${init.displayName}" must be a non-empty string.`);
    }

    if ((!init.guildName) || (typeof init.guildName !== "string") || (init.guildName.trim().length < 1)) {
        throw new Error(`Server Discord guild name "${init.guildName}" must be a non-empty string.`);
    }

    this.id = init.id;
    this.displayName = init.displayName;
    this.guildName = init.guildName;
    this.gymLookupOptions = init.gymLookupOptions || {};

    this.normalized = {
        displayName: Utils.normalize(this.displayName),
        guildName: Utils.normalize(this.guildName),
        gymLookupOptions: GymDirectory.getOptions(this.gymLookupOptions),
    };

    this.key = this.id;
};

ServerConfig.prototype.getGymLookupOptionsAsConfigured = function () { return this.gymLookupOptions; };
ServerConfig.prototype.getEffectiveGymLookupOptions = function () { return this.normalized.gymLookupOptions; };

var ServerConfigManager = function (servers) {
    this.byId = {};
    this.byDisplayName = {};
    this.byGuildName = {};

    if (typeof servers === "string") {
        try {
            let fullPath = path.resolve(servers);
            if (fs.existsSync(fullPath)) {
                servers = JSON.parse(fs.readFileSync(fullPath, "utf8"));
            }
        }
        catch (err) {
            throw new Error(`Error loading server config "${servers}": ${err}`);
        }
    }

    servers.forEach((init) => {
        this.addServerConfig(init);
    });
};

ServerConfigManager.prototype.addServerConfig = function (init) {
    let config = new ServerConfig(init);

    if (this.byId.hasOwnProperty(config.id)) {
        throw new Error(`Server ID ${config.id} defined more than once.`);
    }

    if (this.byDisplayName.hasOwnProperty(config.normalized.displayName)) {
        throw new Error(`Server name "${config.displayName}" defined more than once.`);
    }

    if (this.byGuildName.hasOwnProperty(config.normalized.guildName)) {
        throw new Error(`Discord server guild "${config.guildName}" referenced more than once.`);
    }

    if (this.byDisplayName.hasOwnProperty(config.normalized.guildName)) {
        throw new Error(`Cannot use "${config.guildName}" as both display name and guild name.`);
    }

    if (this.byGuildName.hasOwnProperty(config.normalized.displayName)) {
        throw new Error(`Cannot use "${config.displayName}" as both display name and guild name.`);
    }

    this.byId[config.id] = config;
    this.byDisplayName[config.normalized.displayName] = config;
    this.byGuildName[config.normalized.guildName] = config;
    return config;
};

ServerConfigManager.prototype.tryGetServerConfig = function (name) {
    if (!this.byId[name]) {
        let normalized = Utils.normalize(name);
        return this.byDisplayName[normalized] || this.byGuildName[normalized];
    }
    return this.byId[name];
};

module.exports = ServerConfigManager;
