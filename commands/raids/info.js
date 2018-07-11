"use strict";
const commando = require("discord.js-commando");
const Raid = require("../../lib/raid");

//!info command
class info extends commando.Command {
    constructor(client) {
        super(client, {
            name: "info",
            aliases: [
                "i", "d", "direction", "directions",
            ],
            group: "raids",
            memberName: "info",
            description: "show gym location info",
            examples: ["!info painted", "!info Mysterious Hatch"],
        });
    }

    async run(message, args) {
        let client = message.client;
        let output = "Processing !info command submitted by user " + message.author +  "\n";
        let commandName = "!info";

        process.stdout.write(output);
        message.channel.send(output);

        // if no arguments provided (null or empty string)
        if (!(args)) {
            client.reportError(message, commandName, "no gym name provided.", "!info <gym name>");
            return;
        }

        let lookupOptions = client.config.getEffectiveGymLookupOptionsForMessage(message) || {};

        var gymToGetInfoFor = args.match(/\S+/g).join(" ");
        var gyms = client.raidManager.tryGetGyms(gymToGetInfoFor, lookupOptions);
        if ((!gyms) || (gyms.length < 1)) {
            client.reportError(message, commandName, "no gym found.", "!info <gym name>");
            return;
        }
        gyms.forEach((result) => {
            let gym = result.gym;
            let info = gym.toDiscordMessage();

            let raid = client.raidManager.tryGetRaid(gym.key);
            if (raid) {
                let isActive = (raid.state === Raid.State.hatched);
                let upcomingFormat = "TIER hatches @ HATCH_TIME";
                let activeFormat = "TIER BOSS_NAME ends @ EXPIRY_TIME\n[Raid Guide](GUIDE_LINK)";
                let raidInfo = Raid.raidToString(raid, { active: activeFormat, upcoming: upcomingFormat });

                Raid.forEachRaiderInRaid(raid, (raider) => {
                    raidInfo += `\n${raider.toString()}`;
                });

                let field = {
                    name: (isActive ? "Current Raid" : "Upcoming Raid"),
                    value: raidInfo,
                };
                info.embed.fields.push(field);
                info.embed.thumbnail.url = Raid.getRaidThumbnail(raid);
            }

            message.channel.send(info).catch(console.log);
        });
    }
}

module.exports = info;
