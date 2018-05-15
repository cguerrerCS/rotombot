const commando = require('discord.js-commando');
const ProcessRaidsCommand = require('./../../rotombot.js');
//!raids command
class raids extends commando.Command{
    constructor(client){
        super(client,{
            name: 'raids',
            group: 'raids',
            memberName: 'raids',
            description: 'list current raids',
            examples: ['!raids']
        })
    }
    async run(message, args){ /*ProcessRaidsCommand(message, false);*/ } 
}

module.exports = raids;