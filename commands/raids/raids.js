"use strict";
const commando = require("discord.js-commando");
const RaidsCommand = require("../../lib/raidsCommand");

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
                "  !raids [in <cities>]",
                "  !raids",
                "  !raids in redmond",
                "  !raids in redmond, rose hill",
                "All raids:",
                "  !raids all [in <cities>]",
                "  !raids all in rose hill",
                "Ex-eligible raids:",
                "  !raids ex [in <cities>]",
                "  !raids ex in redmond",
                "Exact tier:",
                "  !raids <tier> [in <cities>]",
                "  !raids 4",
                "  !raids 4 in overlake",
                "Minimum tier:",
                "  !raids <minTier>+ [in <cities>]",
                "  !raids 3+",
                "  !raids 3+ in bellevue",
                "Range of tiers:",
                "  !raids <minTier>-<maxTier> [in <cities>]",
                "  !raids 1-3",
                "  !raids 1-3 in lake hills",
                "Additional options:",
                "  Add +nocards for text output",
                "  Add +raidcards for a card per raid",
                "  Add +listcard to display all raids in one card (default)",
                "  Add +rsvp to get a list of raiders who have rsvp'ed for the raids",
            ],
        });
    }

    async run(message) {
        let client = message.client;
        let content = message.content;

        try {
            let lookupOptions = client.config.getEffectiveGymLookupOptionsForMessage(message);
            let command = new RaidsCommand(content, client.raidManager);
            let messages = command.getMessages(lookupOptions);
            messages.forEach((m) => {
                message.channel.send(m.embed ? m : m.content).catch(console.log);
            });
        }
        catch (err) {
            if (err) {
                client.reportError(
                    message,
                    "!raids",
                    `My circuitzzz are tingling! I didn't understand that command...\n(${err})`,
                    this.examples.join("\n"),
                );
            }
            return;
        }
    }
}

module.exports = raids;
