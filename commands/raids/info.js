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
        let client = message.client;
        let output = "Processing !info command submitted by user " + message.author +  "\n";

        process.stdout.write(output);
        message.channel.send(output);

        // if no arguments provided (null or empty string)
        if (!(args)) {
            client.reportError(message, "!info", "no gym name provided.", "!info <gym name>");
            return;
        }

        let lookupOptions = client.config.getEffectiveGymLookupOptionsForMessage(message) || {};

        var gymToGetInfoFor = args.match(/\S+/g).join(" ");
        var gyms = client.raidManager.tryGetGyms(gymToGetInfoFor, lookupOptions);
        if ((!gyms) || (gyms.length < 1)) {
            client.reportError(message, "!info", "no gym found.", "!info <gym name>");
            return;
        }

        gyms.forEach((result) => {
            let gym = result.gym;
            var infoContent =
            `Name: *${gym.officialName}*\n` +
            `Friendly Name: *${gym.friendlyName}*\n` +
            `Ex-Eligible: ${gym.isExEligible ? "**YES**" : "_No_"}\n` +
            `City: *${gym.city}*\n` +
            `Zones: *${gym.zones.join(",")}*\n`;

            let raid = client.raidManager.tryGetRaid(gym.key);
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

            infoContent += `Directions: *<${gym.mapLink}>*\n`;

            message.channel.send(infoContent);
        });
    }
}

module.exports = info;
