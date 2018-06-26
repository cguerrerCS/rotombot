"use strict";

const ServerConfigManager = require("./serverConfigManager");
const UserConfigManager = require("./userConfigManager");
const Utils = require("./utils");

const defaultOptions = {
    server: "./data/Servers.json",
    user: "./state/Users.json",
    logger: null,
};

var ConfigManager = function (options) {
    options = Utils.mergeOptions(defaultOptions, options);
    this.server = new ServerConfigManager(options.server);
    this.user = new UserConfigManager(options.user);
};

ConfigManager.prototype.getEffectiveGymLookupOptionsForMessage = function (message) {
    let user = this.user.tryGetUserConfig(message.member.id);
    let server = this.server.tryGetServerConfig(message.guild.id);
    return user ? user.getEffectiveGymLookupOptions(server) : server.getEffectiveGymLookupOptions();
};

ConfigManager.prototype.getUserConfigForMessage = function (message) {
    return this.user.tryGetUserConfig(message.member.id);
};

ConfigManager.prototype.getChannelConfigForMessage = function () {
    return undefined;
};

ConfigManager.prototype.getServerConfigForMessage = function (message) {
    return this.server.tryGetServerConfig(message.guild.id);
};

ConfigManager.prototype.getEffectiveGymLookupOptionsForChannel = function (channel) {
    let server = this.server.tryGetServerConfig(channel.guild.id);
    return server ? server.getEffectiveGymLookupOptions() : undefined;
};

ConfigManager.prototype.updateGymLookupOptionsForMessage = function (message, updatedOptions) {
    let update = {
        id: message.member.id,
        userName: message.member.displayName,
        gymLookupOptions: updatedOptions,
    };
    return this.user.addOrUpdateUserConfig(update);
};

module.exports = ConfigManager;
