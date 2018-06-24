"use strict";
const commando = require("discord.js-commando");

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
        let city = undefined;
        let cityRegex = /.*/;

        let config = client.config.getEffectiveGymLookupOptionsForMessage(message);
        let effectiveConfig = (config && config.normalized ? config.normalized.gymLookupOptions : undefined);

        console.log(`In !raids, config as supplied: ${JSON.stringify(config.gymLookupOptions)}`);
        console.log(`In !raids, effective config is: ${JSON.stringify(effectiveConfig)}`);
        let match = message.content.match(allRaidsRegex);
        if (match !== null) {
            minTier = 1;
            maxTier = 5;
            city = match[1];
        }
        else {
            match = message.content.match(minRaidsRegex);
            if (match !== null) {
                minTier = match[1];
                maxTier = (match[2] === "+" ? 5 : minTier);
                city = match[3];
            }
            else {
                match = message.content.match(rangeRaidsRegex);
                if (match !== null) {
                    minTier = match[1];
                    maxTier = match[2];
                    city = match[3];
                }
                else {
                    match = message.content.match(defaultRaidsRegex);
                    if (match === null) {
                        client.reportError(
                            message,
                            "!add",
                            "My circuitzzz are tingling! I didn't understand that command..."
                        );
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
        message.channel.send(client.raidManager.listFormatted((r) => {
            return (r.tier >= minTier) && (r.tier <= maxTier) && cityRegex.test(r.gym.city);
        }, description));
    }
}

module.exports = raids;
