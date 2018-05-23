const commando = require('discord.js-commando');
const cmdParser = require('discord-command-parser');

//!info command
class info extends commando.Command{
    constructor(client){
        super(client,{
            name: 'info',
            group: 'raids',
            memberName: 'info',
            description: 'show gym location info',
            examples: ['!info painted', '!info Mysterious Hatch']
        })
    }
    async run(message, args){

      var client = message.client;
      var output = "Processing !info command submitted by user " + message.author +  "\n";
      process.stdout.write(output);
      message.channel.send(output);

      // if no arguments provided (null or empty string)
      if (!(args))
      {
        client.ReportError(message, "!info", "no gym name provided.", "!info <gym name>");
        return;
      }

      var raidToGetInfoFor = args.match(/\S+/g).join(' ');
      var searchResults = client.RaidsFuzzySearch.search(raidToGetInfoFor);
      if (searchResults.length < 1)
      {
        client.ReportError(message, "!info", "no gym found.", "!info <gym name>");
        return;
      }

      // City: row[0],
      // RaidLocation: row[1],
      // FriendlyName: row[2],
      // Lng: row[3],
      // Lat: row[4],
      // MapLink: row[5]

      // TODO: improve this to show info if raid requested is active or in egg state, will need to ask RaidManager for this data...
      var closestResult = searchResults[0];
      var infoContent = "*Location Name: " + closestResult.RaidLocation + "*\n";
      infoContent += "*Friendly Name: " + closestResult.FriendlyName + "*\n";

      message.channel.send(infoContent);
    }
}

module.exports = info;
