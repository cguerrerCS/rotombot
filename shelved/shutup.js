const commando = require('discord.js-commando');
//!shutup command
class shutup extends commando.Command{
    constructor(client){
        super(client,{
            name: 'shutup',
            group: 'raids',
            memberName: 'shutup',
            description: 'tell Amzerik to shut up and shoot him',
            examples: ['!shutup']
        })
    }
    async run(message, args){
        /*var output = 'shutup @Amzerik Braap! Braap!\n';
        message.channel.send(output);*/
    }
}

module.exports = shutup;