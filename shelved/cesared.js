const commando = require('discord.js-commando');
class cesared extends commando.Command{
    constructor(client){
        super(client,{
            name: 'cesared',
            group: 'raids',
            memberName: 'cesared',
            description: 'first ball catch'
        });
    }

    async run(message, args){
        //message.channel.sendMessage('NANANANAAAA!!!');
    }
}

module.exports = cesared;