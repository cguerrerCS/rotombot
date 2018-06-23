"use strict";
const commando = require("discord.js-commando");
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

    formatGymOptions(title, options) {
        let messages = [title];
        [
            { field: "requiredZones", label: "Required Zones: "},
            { field: "requiredCities", label: "Required Cities: "},
            { field: "preferredZones", label: "Preferred Zones: "},
            { field: "preferredCities", label: "Preferred Cities: "}
        ].forEach((field) => {
            if (options[field.field] && (options[field.field].length > 0)) {
                let setting = options[field.field].join(", ");
                messages.push(`${field.label}${setting}\n`);
            } 
        });
        return (messages.length > 1) ? messages : [];
    }

    addFormattedGymOptions(output, title, options) {
        let needBreak = (output.length > 0);
        this.formatGymOptions(title, options).forEach((line) => {
            if (needBreak) {
                line.push("");
                needBreak = false;
            }
            output.push(line);
        });
    }

    async run(message) {
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

        let infoOutput = [];
        let config = client.config.getServerConfigForMessage(message);
        if (config && config.gymLookupOptions) {
            this.addFormattedGymOptions(infoOutput, "Server lookup settings:", config.gymLookupOptions);
        }

        config = client.config.getUserConfigForMessage(message);
        if (config && config.gymLookupOptions) {
            this.addFormattedGymOptions(infoOutput, "User lookup settings:", config.gymLookupOptions);
        }

        if (infoOutput.length > 0) {
            message.channel.send(infoOutput.join("\n"));
        }
        else {
            message.channel.send("No settings");
        }
    }
}

module.exports = info;
