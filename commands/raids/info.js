"use strict";
const commando = require("discord.js-commando");
const Raid = require("../../lib/raid");

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
            let info = gym.toDiscordMessage();

            let raid = client.raidManager.tryGetRaid(gym.key);
            if (raid) {
                let upcomingFormat = "TIER hatches @ HATCH_TIME";
                let activeFormat = "TIER BOSS_NAME ends @ EXPIRY_TIME\n[Raid Guide](GUIDE_LINK)";
                let raidInfo = Raid.raidToString(raid, { active: activeFormat, upcoming: upcomingFormat });
                let field = {
                    name: (raidInfo.active ? "Current Raid" : "Upcoming Raid"),
                    value: raidInfo.description,
                };
                info.embed.fields.push(field);
                info.embed.thumbnail.url = `http://www.didjaredo.com/pogo/images/48x48/${raidInfo.active ? "regice" : "t5"}.png`;
            }

            message.channel.send(info);
        });
    }
}

module.exports = info;
