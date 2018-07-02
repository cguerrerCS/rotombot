"use strict";
const commando = require("discord.js-commando");
const Raid = require("../../lib/raid");
const Utils = require("../../lib/utils");

const defaultRaidsRegex = /^!raids\s*(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i;
const allRaidsRegex = /^!raids\s+all\s*(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i;
const minRaidsRegex = /^!raids\s+(?:T)?(\d)([+]?)\s*(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i;
const rangeRaidsRegex = /^!raids\s+(?:T)?(\d)\s*-\s*(?:T)?(\d)\s*(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i;

//!raids command
class raids extends commando.Command {
    constructor(client) {
        super(client, {
            name: "raids",
            group: "raids",
            memberName: "raids",
            description: "list current raids",
            examples: [
                "Default (T4 & 5):",
                "  !raids [in <city>]",
                "  !raids",
                "  !raids in redmond",
                "All raids:",
                "  !raids all [in <city>]",
                "  !raids all in rose hill",
                "Exact tier:",
                "  !raids <tier> [in <city>]",
                "  !raids 4",
                "  !raids 4 in overlake",
                "Minimum tier:",
                "  !raids <minTier>+ [in <city>]",
                "  !raids 3+",
                "  !raids 3+ in bellevue",
                "Range of tiers:",
                "  !raids <minTier>-<maxTier> [in <city>]",
                "  !raids 1-3",
                "  !raids 1-3 in lake hills",
            ],
        });
    }

    async run(message) {
        let client = message.client;
        let minTier = 4;
        let maxTier = 5;
        let all = false;
        let city = undefined;
        let cityRegex = /.*/;

        let lookupOptions = client.config.getEffectiveGymLookupOptionsForMessage(message);

        let content = message.content;

        let showListCard = false;
        Utils.extract(content, "+listcard", (c) => {
            showListCard = true;
            content = c;
        });

        let showRaidCards = false;
        Utils.extract(content, "+raidcards", (c) => {
            showRaidCards = true;
            content = c;
        });

        let match = content.match(allRaidsRegex);
        if (match !== null) {
            minTier = 1;
            maxTier = 5;
            city = match[1];
            all = true;
        }
        else {
            match = content.match(minRaidsRegex);
            if (match !== null) {
                minTier = match[1];
                maxTier = (match[2] === "+" ? 5 : minTier);
                city = match[3];
            }
            else {
                match = content.match(rangeRaidsRegex);
                if (match !== null) {
                    minTier = match[1];
                    maxTier = match[2];
                    city = match[3];
                }
                else {
                    match = content.match(defaultRaidsRegex);
                    if (match === null) {
                        client.reportError(
                            message,
                            "!add",
                            "My circuitzzz are tingling! I didn't understand that command..."
                        );
                        return;
                    }

                    if (match[1]) {
                        city = match[1];
                    }
                }
            }
        }

        if (city) {
            cityRegex = new RegExp(`.*${city}.*`, "i");
        }

        let description = (((minTier === maxTier) ? `T${minTier}` : `T${minTier}-T${maxTier}`) + (city ? ` in ${city}` : ""));
        let raids = client.raidManager.list((r) => {
            return (r.tier >= minTier) && (r.tier <= maxTier) && cityRegex.test(r.gym.city);
        });

        if ((!city) && (!all)) {
            raids = client.raidManager.chooseBestRaidsForLookupOptions(raids, lookupOptions);
        }

        if (showListCard) {
            let msg = Raid.raidListToDiscordMessage(raids, { description: description });
            message.channel.send(msg);
        }
        else if (showRaidCards) {
            if (raids && (raids.length > 0)) {
                raids.forEach((raid) => {
                    let rm = Raid.raidToDiscordMessage(raid);
                    message.channel.send(rm).catch(console.error);
                });
            }
            else {
                message.channel.send(`No raids to report (${description})`).catch(console.error);
            }
        }
        else {
            let rl = Raid.getFormattedRaidListOutputAsString(raids, { description: description });
            message.channel.send(rl);
        }
    }
}

module.exports = raids;
