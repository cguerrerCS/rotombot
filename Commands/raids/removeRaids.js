const commando = require('discord.js-commando');
//const ProcessRemoveCommand = require('./../../index.js');
//!remove command
class remove extends commando.Command{
    constructor(client){
        super(client,{
            name: 'remove',
            group: 'raids',
            memberName:'remove',
            description: 'remove from raid list',
            examples: ['!remove Luke McRedmond', '!remove Erratic']
        })
    }
    async run(message, args){
        /*var cmd = message.content.split(' ')[0].toLowerCase();      
        var output = 'Processing ' + cmd + ' command submitted by user ' + message.author +  '\n';
        process.stdout.write(output);
        message.channel.send(output);
        ProcessRemoveCommand(message);*/
    }
}

module.exports = remove;