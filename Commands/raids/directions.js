const commando = require('discord.js-commando');
//const ProcessRaidsCommand = require('./../../index.js');
//const ReportError = require('./../../index.js');
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
    async run(message, args){
        /*function ProcessDirectionsCommand(message){
            if (message.content.startsWith("!directions")){
                var raidToGetDirectionsFor = message.content.replace("!directions", "").trim();
                var searchResults = fuse.search(raidToGetDirectionsFor);
                if (searchResults.length < 1){
                    ReportError(message, "!directions", "");
                    return;
                }
        
                var closestResult = searchResults[0];
                var directionsContent = closestResult.RaidLocation + " [Directions]\n" + closestResult.MapLink + "\n";
                message.channel.send(directionsContent);
            }
        }
        ProcessRaidsCommand(message, true);*/
    }
}

module.exports = directions;