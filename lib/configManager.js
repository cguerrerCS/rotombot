"use strict";

const ServerConfigManager = require("./serverConfigManager");
const UserConfigManager = require("./userConfigManager");
const Utils = require("./Utils");

const defaultOptions = {
    server: "./data/Servers.json",
    user: "./states/Users.json",
};

var ConfigManager = function (options) {
    options = Utils.mergeOptions(defaultOptions, options);
    this.server = new ServerConfigManager(options.server);
    this.user = new UserConfigManager(options.user);
};

ConfigManager.prototype.getEffectiveConfigForMessage = function (message) {
    let user = this.user.tryGetUser(message.member.id);
    let server = this.server.tryGetServer(message.guild.id);
    return user ? user.getEffectiveOptions(server) : server;
};

ConfigManager.prototype.getUserConfigForMessage = function (message) {
    return this.user.tryGetUser(message.member.id);
};

ConfigManager.prototype.getChannelConfigForMessage = function () {
    return undefined;
};

ConfigManager.prototype.getServerConfigForMessage = function (message) {
    return this.server.tryGetServer(message.guild.id);
};

module.exports = ConfigManager;
