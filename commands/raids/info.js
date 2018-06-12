"use strict";
const commando = require("discord.js-commando");
const RaidManager = require("../../lib/raidManager");

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

        var gymToGetInfoFor = args.match(/\S+/g).join(" ");
        var gym = client.raidManager.tryGetGym(gymToGetInfoFor);
        if (!gym) {
            client.reportError(message, "!info", "no gym found.", "!info <gym name>");
            return;
        }

        var infoContent =
            `Name: *${gym.name}*\n` +
            `Friendly Name: *${gym.friendlyName}*\n` +
            `City: *${gym.city}*\n`;

        let raid = client.raidManager.tryGetRaid(gym.name);
        if (raid) {
            let raidInfo = RaidManager.getFormattedRaidDescription(raid, "Upcoming: TIER hatches @ HATCH_TIME\n", "Current: TIER BOSS_NAME ends @ EXPIRY_TIME\n");
            infoContent += raidInfo.description;
            for (let key in raid.raiders) {
                if (raid.raiders.hasOwnProperty(key)) {
                    let raider = raid.raiders[key];
                    if (!raider.endTime) {
                        infoContent += `        ${raider.toString()}\n`;
                    }
                }
            }
        }

        infoContent += `Directions: *${gym.mapLink}*\n`;

        message.channel.send(infoContent);
    }
}

module.exports = info;
