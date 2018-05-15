const commando = require('discord.js-commando');
//const ProcessRaidsCommand = require('./../../index.js');
//const ReportError = require('./../../index.js');
//!add command
class add extends commando.Command{
    constructor(client){
        super(client,{
            name: 'add',
            group: 'raids',
            memberName: 'add',
            description: 'add to raid list',
            examples: ['!add Luke McRedmond @ 12:45 pm','!add Erratic @ 10:30 am']
        })
    }
    async run(message, args){
        /*var cmd = message.content.split(" ")[0].toLowerCase();
        var output = "Processing " + cmd + " command submitted by user " + message.author +  "\n";
        process.stdout.write(output);
        message.channel.send(output);
		ProcessAddCommand(message);*/
    }
}

module.exports = add;