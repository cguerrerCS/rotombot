"use strict";
const commando = require("discord.js-commando");
const RaidManager = require("../../lib/raidManager");
const MyParser = require("../../lib/myParser");

//!info command
class info extends commando.Command {
    constructor(client) {
        super(client, {
            name: "my",
            group: "player",
            memberName: "my",
            description: "get/set information about the user",
            examples: ["!my info", "!my cities", "!my cities are redmond,education hill"],
        });
    }

    async run(message, args) {
        var client = message.client;
        var output = "Processing !my command submitted by user " + message.author +  "\n";
        process.stdout.write(output);
        message.channel.send(output);

        let want = MyParser.tryParse(message.content);

        // if no arguments provided (null or empty string)
        if (!want) {
            client.reportError(
                message,
                "!add",
                "My circuitzzz are tingling! I didn't understand that command..."
            );
            return;
        }

        let config = client.config.getConfigForMessage(message);
        let gymOptions = (config ? config.gymLookupOptions : {});
        message.channel.send(`want: ${JSON.stringify(want)}`);
        message.channel.send(`config: ${JSON.stringify(gymOptions)}`);

    }
}

module.exports = info;
