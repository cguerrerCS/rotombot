"use strict";
const commando = require("discord.js-commando");
const RaidsParser = require("../../lib/raidsParser");

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
        let content = message.content;

        try {
            // block embeds for dms
            let lookupOptions = client.config.getEffectiveGymLookupOptionsForMessage(message);
            let command = RaidsParser.tryParse(content, (message.channel.type !== 0));
            let messages = RaidsParser.getMessagesForCommand(command, client.raidManager, lookupOptions);
            messages.forEach((m) => {
                message.channel.send(m.embed ? m : m.content).catch(console.log);
            });
        }
        catch (err) {
            if (err) {
                client.reportError(
                    message,
                    "!raids",
                    "My circuitzzz are tingling! I didn't understand that command...",
                    this.examples.join("\n"),
                );
            }
            return;
        }
    }
}

module.exports = raids;
