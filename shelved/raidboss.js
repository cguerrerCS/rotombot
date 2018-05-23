const commando = require('discord.js-commando');
const cmdParser = require('discord-command-parser');

//!remove command
class raidboss extends commando.Command{
    constructor(client){
        super(client,{
            name: 'raidboss',
            group: 'raids',
            memberName:'raidboss',
            description: 'Report raid boss for hatched egg.',
            examples: [
              '!raidboss <raid boss> <location>',
              '!raidboss Latios Painted Parking'
            ]
        })
    }
    async run(message){

      var client = message.client;
      var output = "Processing !raidboss command submitted by user " + message.author +  "\n";
      process.stdout.write(output);
      message.channel.send(output);

      // cannot remove from dms
      if (message.channel.type.toString() == "dm")
      {
          client.ReportError(message, "!raidboss", "cannot set raid boss via DMs.");
          return;
      }

      // parse arguments
      let parsed = cmdParser.parse(message, '!');
      if (!parsed.success) return;
      if (parsed.arguments.length < 2)
      {
        client.ReportError(message, "!raidboss", "too few arguments.", this.examples[0]);
        return;
      }

      var pkmn = parsed.arguments[0];
      var pkmnSearchResults = client.RaidBossFuzzySearch.search(pkmn);
      if (pkmnSearchResults.length < 1) {
        client.ReportError(message, "!raidboss", "no raid boss pokemon matching [" + pkmn + "] found in search results", this.examples[0]);
        return;
      }

      var closestPkmnResult = pkmnSearchResults[0];
      var tier = parseInt(closestPkmnResult.RaidTier.replace("Tier", "").trim());

      var raidToraidbossFor = parsed.arguments.slice(1, parsed.arguments.length).join(' ');
      var searchResults = client.RaidsFuzzySearch.search(raidToraidbossFor);
      if (searchResults.length < 1)
      {
        client.ReportError(message, "!raidboss", "no gym found.", this.examples[0]);
        return;
      }

      var closestResult = searchResults[0];

      try {
        client.RaidManager.setRaidBoss(closestPkmnResult.RaidBoss, tier, closestResult.RaidLocation);
      } catch(err) {
        client.ReportError(message, "!raidboss", err, this.examples[0]);
        return;
      }

      message.channel.send(client.RaidManager.listFormatted());
      return;
    }
}

module.exports = raidboss;
