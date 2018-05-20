const commando = require('discord.js-commando');
const cmdParser = require('discord-command-parser');

//!directions command
class directions extends commando.Command{
    constructor(client){
        super(client,{
            name: 'directions',
            group: 'raids',
            memberName: 'directions',
            description: 'show directions to current raids',
            examples: ['!directions painted', '!directions Mysterious Hatch']
        })
    }
    async run(message){

      var client = message.client;
      var output = "Processing !directions command submitted by user " + message.author +  "\n";
      process.stdout.write(output);
      message.channel.send(output);

      // parse arguments
      let parsed = cmdParser.parse(message, '!');
      if (!parsed.success) return;
      if (parsed.arguments.length === 0)
      {
        client.ReportError(message, "!directions", "no gym name provided.");
        return;
      }

      var raidToGetDirectionsFor = parsed.arguments.join(' ');
      var searchResults = client.RaidsFuzzySearch.search(raidToGetDirectionsFor);
      if (searchResults.length < 1)
      {
        client.ReportError(message, "!directions", "no gym found.");
        return;
      }

      var closestResult = searchResults[0];
      var directionsContent = closestResult.RaidLocation + " [Directions]\n" + closestResult.MapLink + "\n";
      message.channel.send(directionsContent);
    }
}

module.exports = directions;
