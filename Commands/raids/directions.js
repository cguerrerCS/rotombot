const commando = require('discord.js-commando');
const cmdParser = require('discord-command-parser');

//!directions command
class directions extends commando.Command{
    constructor(client){
        super(client,{
            name: 'directions',
            group: 'raids',
            memberName: 'directions',
            description: 'show gym location directions',
            examples: ['!directions painted', '!directions Mysterious Hatch']
        })
    }
    async run(message, args){

      var client = message.client;
      var output = "Processing !directions command submitted by user " + message.author +  "\n";
      process.stdout.write(output);
      message.channel.send(output);

      // if no arguments provided (null or empty string)
      if (!(args))
      {
        client.ReportError(message, "!directions", "no gym name provided.", "!directions <gym name>");
        return;
      }

      var raidToGetDirectionsFor = args.match(/\S+/g).join(' ');
      var searchResults = client.RaidsFuzzySearch.search(raidToGetDirectionsFor);
      if (searchResults.length < 1)
      {
        client.ReportError(message, "!directions", "no gym found.", "!directions <gym name>");
        return;
      }

      var closestResult = searchResults[0];
      var directionsContent = closestResult.RaidLocation + " [Directions]\n" + closestResult.MapLink + "\n";
      message.channel.send(directionsContent);
    }
}

module.exports = directions;
