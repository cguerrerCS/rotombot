"use strict";
const commando = require("discord.js-commando");
const cmdParser = require("discord-command-parser");

//!remove command
class remove extends commando.Command {
    constructor(client) {
        super(client, {
            name: "remove",
            group: "raids",
            memberName: "remove",
            description: "remove from raid list",
            examples: ["!remove <gym name>", "!remove Luke McRedmond", "!remove Erratic"],
        });
    }
    async run(message) {
        var client = message.client;
        var output = "Processing !remove command submitted by user " + message.author +  "\n";
        process.stdout.write(output);
        message.channel.send(output);

        // cannot remove from dms
        if (message.channel.type.toString() === "dm") {
            client.reportError(message, "!remove", "cannot remove active raids via DMs.");
            return;
        }

        // parse arguments
        let parsed = cmdParser.parse(message, "!");
        if (!parsed.success) { return; }
        if (parsed.arguments.length === 0) {
            client.reportError(message, "!remove", "no gym name provided.", this.examples[0]);
            return;
        }

        var raidToRemove = parsed.arguments.join(" ");
        try {
            client.raidManager.removeRaid(raidToRemove);
        }
        catch (err) {
            client.reportError(message, "!remove", err, this.examples[0]);
            return;
        }

        message.channel.send(client.raidManager.listFormatted());
        return;
    }
}

module.exports = remove;
