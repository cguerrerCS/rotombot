"use strict";

const Utils = require("./utils");
const GymDirectory = require("./gymDirectory");

var ServerConfig = function (init) {
    if ((!init.displayName) || (typeof init.displayName !== "string") || (init.displayName.trim().length < 1)) {
        throw new Error(`Server display name "${init.displayName}" must be a non-empty string.`);
    }

    if ((!init.guildName) || (typeof init.guildName !== "string") || (init.guildName.trim().length < 1)) {
        throw new Error(`Server Discord guild name "${init.guildName}" must be a non-empty string.`);
    }

    this.displayName = init.displayName;
    this.guildName = init.guildName;
    this.gymLookupOptions = init.gymLookupOptions || {};

    this.normalized = {
        displayName: Utils.normalize(this.displayName),
        guildName: Utils.normalize(this.guildName),
        gymLookupOptions: GymDirectory.getOptions(this.gymLookupOptions),
    };

    this.key = this.normalized.displayName;
};

ServerConfig.prototype.getServerOptionsAsConfigured = function () { return this.gymLookupOptions; };
ServerConfig.prototype.getEffectiveServerOptions = function () { return this.normalized.gymLookupOptions; };

var ServerManager = function (servers) {
    this.byDisplayName = {};
    this.byGuildName = {};

    servers.forEach((init) => {
        this.addServer(init);
    });
};

ServerManager.prototype.addServer = function (init) {
    let config = new ServerConfig(init);

    if (this.byDisplayName.hasOwnProperty(config.normalized.displayName)) {
        throw new Error(`Server "${config.displayName}" defined more than once.`);
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

    this.byDisplayName[config.normalized.displayName] = config;
    this.byGuildName[config.normalized.guildName] = config;
    return config;
};

ServerManager.prototype.tryGetServer = function (name) {
    let normalized = Utils.normalize(name);
    return this.byDisplayName[normalized] || this.byGuildName[normalized];
};

module.exports = ServerManager;
