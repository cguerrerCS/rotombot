const commando = require('discord.js-commando');
const cmdParser = require('discord-command-parser');

//!remove command
class setboss extends commando.Command{
    constructor(client){
        super(client,{
            name: 'setboss',
            group: 'raids',
            memberName:'setboss',
            description: 'Report raid boss for hatched egg.',
            examples: [
              '!setboss <raid boss> <location>',
              '!setboss Latios Painted Parking'
            ]
        })
    }
    async run(message){

      var client = message.client;
      var output = "Processing !setboss command submitted by user " + message.author +  "\n";
      process.stdout.write(output);
      message.channel.send(output);

      // cannot remove from dms
      if (message.channel.type.toString() == "dm")
      {
          client.ReportError(message, "!setboss", "cannot set raid boss via DMs.");
          return;
      }

      // parse arguments
      let parsed = cmdParser.parse(message, '!');
      if (!parsed.success) return;
      if (parsed.arguments.length < 2)
      {
        client.ReportError(message, "!setboss", "too few arguments.");
        return;
      }

      var pkmn = parsed.arguments[0];
      var pkmnSearchResults = client.RaidBossFuzzySearch.search(pkmn);
      if (pkmnSearchResults.length < 1) {
        client.ReportError(message, "!setboss", "no raid boss pokemon matching [" + pkmn + "] found in search results");
        return;
      }

      var closestPkmnResult = pkmnSearchResults[0];
      var tier = parseInt(closestPkmnResult.RaidTier.replace("Tier", "").trim());

      var raidToSetBossFor = parsed.arguments.slice(1, parsed.arguments.length).join(' ');
      var searchResults = client.RaidsFuzzySearch.search(raidToSetBossFor);
      if (searchResults.length < 1)
      {
        client.ReportError(message, "!setboss", "no gym found.");
        return;
      }

      var closestResult = searchResults[0];

      try {
        client.RaidManager.setRaidBoss(closestPkmnResult.RaidBoss, tier, closestResult.RaidLocation);
      } catch(err) {
        client.ReportError(message, "!setboss", err);
        return;
      }

      message.channel.send(client.RaidManager.listFormatted());
      return;
    }
}

module.exports = setboss;
