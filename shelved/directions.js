"use strict";
const commando = require("discord.js-commando");

//!directions command
class directions extends commando.Command {
    constructor(client) {
        super(client, {
            name: "directions",
            group: "raids",
            memberName: "directions",
            description: "show gym location directions",
            examples: ["!directions painted", "!directions Mysterious Hatch"],
        });
    }

    async run(message, args) {
        var client = message.client;
        var output = "Processing !directions command submitted by user " + message.author +  "\n";
        process.stdout.write(output);
        message.channel.send(output);

        // if no arguments provided (null or empty string)
        if (!(args)) {
            client.reportError(message, "!directions", "no gym name provided.", "!directions <gym name>");
            return;
        }

        var lookupOptions = client.config.getEffectiveGymLookupOptionsForMessage(message);

        var raidToGetDirectionsFor = args.match(/\S+/g).join(" ");
        let gym = client.raidManager.tryGetGym(raidToGetDirectionsFor, lookupOptions);
        var directionsContent = `${gym.officialName} [Directions]\n<${gym.mapLink}>\n`;
        message.channel.send(directionsContent);
    }
}

module.exports = directions;
