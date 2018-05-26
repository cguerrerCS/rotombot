"use strict";
const commando = require("discord.js-commando");

//!info command
class info extends commando.Command {
    constructor(client) {
        super(client, {
            name: "info",
            group: "raids",
            memberName: "info",
            description: "show gym location info",
            examples: ["!info painted", "!info Mysterious Hatch"],
        });
    }

    async run(message, args) {
        var client = message.client;
        var output = "Processing !info command submitted by user " + message.author +  "\n";
        process.stdout.write(output);
        message.channel.send(output);

        // if no arguments provided (null or empty string)
        if (!(args)) {
            client.reportError(message, "!info", "no gym name provided.", "!info <gym name>");
            return;
        }

        var raidToGetInfoFor = args.match(/\S+/g).join(" ");
        var gym = client.raidManager.tryGetGym(raidToGetInfoFor);
        if (!gym) {
            client.reportError(message, "!info", "no gym found.", "!info <gym name>");
            return;
        }

        var infoContent =
            `Name: *${gym.name}*\n` +
            `Friendly Name: *${gym.friendlyName}*\n` +
            `City: *${gym.city}*\n` + 
            `Directions: *${gym.mapLink}*\n`;

        message.channel.send(infoContent);
    }
}

module.exports = info;
