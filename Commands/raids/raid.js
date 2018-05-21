const commando = require('discord.js-commando');
const cmdParser = require('discord-command-parser');

//!add command
class raid extends commando.Command{
    constructor(client){
        super(client,{
            name: 'raid',
            group: 'raids',
            memberName: 'raid',
            description: 'add raid to active raids list',
            examples: [
              '!raid <pkmn> <location> <minutes left>',
              '!raid ho-oh Luke McRedmond 30'
            ]
        })
    }

    async run(message) {

        var client = message.client;
        var output = "Processing !raid command submitted by user " + message.author +  "\n";
        process.stdout.write(output);
        message.channel.send(output);

        if (message.channel.type.toString() == "dm")
        {
            client.ReportError(message, "!raid", "cannot add active raids via DMs.");
            return;
        }

        // parse arguments
        let parsed = cmdParser.parse(message, '!');
        if (!parsed.success) return;

        // clean up additional whitespace between arguments
        var input = parsed.arguments.join(' ');
        console.log(parsed.arguments);

        if (parsed.arguments.length < 3)
        {
          client.ReportError(message, "!raid", "too few arguments.");
          return;
        }

        var pkmn = parsed.arguments[0];
        var location = parsed.arguments.slice(1, (parsed.arguments.length - 1)).join(' ');
        var countdown = parsed.arguments[parsed.arguments.length - 1];

        console.log("pkmn: " + pkmn);
        console.log("location: " + location);
        console.log("countdown: " + countdown);

        // TODO: validate and resolve raid boss data...
        // ...
        var pkmnSearchResults = client.RaidBossFuzzySearch.search(pkmn);
        if (pkmnSearchResults.length < 1) {
          client.ReportError(message, "!raid", "no raid boss pokemon matching [" + pkmn + "] found in search results");
          return;
        }
        var closestPkmnResult = pkmnSearchResults[0];
        var tier = parseInt(closestPkmnResult.RaidTier.replace("Tier", "").trim());

        var searchResults = client.RaidsFuzzySearch.search(location);
        if (searchResults.length < 1)
        {
          client.ReportError(message, "!raid", "no gym found matching search results");
          return;
        }
        var closestResult = searchResults[0];

        try {
          client.RaidManager.addRaid(closestPkmnResult.RaidBoss, tier, closestResult.RaidLocation, countdown );
        } catch(err) {
          client.ReportError(message, "!raid", err);
          return;
        }

        message.channel.send(client.RaidManager.listFormatted());
        console.log(client.RaidManager.list());
        return;
    }
}

module.exports = raid;
