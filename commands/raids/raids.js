"use strict";
const commando = require("discord.js-commando");

const defaultRaidsRegex = /^!raids\s*$/i;
const allRaidsRegex = /^!raids\s+all\s*$/i;
const minRaidsRegex = /^!raids\s+(\d)([+]?)\s*$/i;
const rangeRaidsRegex = /^!raids\s+(\d)\s*-\s*(\d)\s*$/i;

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
                "  !raids",
                "All raids:",
                "  !raids all",
                "Exact tier:",
                "  !raids <tier>",
                "  !raids 4",
                "Minimum tier:",
                "  !raids <minTier>+",
                "  !raids 3+",
                "Range of tiers:",
                "  !raids <minTier>-<maxTier>",
                "  !raids 1-3",
            ],
        });
    }

    async run(message) {
        let client = message.client;
        let minTier = 4;
        let maxTier = 5;

        let match = message.content.match(allRaidsRegex);
        if (match !== null) {
            minTier = 1;
            maxTier = 5;
        }
        else {
            match = message.content.match(minRaidsRegex);
            if (match !== null) {
                minTier = match[1];
                maxTier = (match[2] === "+" ? 5 : minTier);
            }
            else {
                match = message.content.match(rangeRaidsRegex);
                if (match !== null) {
                    minTier = match[1];
                    maxTier = match[2];
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
                }
            }
        }

        message.channel.send(client.raidManager.listFormatted(minTier, maxTier));
    }
}

module.exports = raids;
