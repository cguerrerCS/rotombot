"use strict";
const commando = require('discord.js-commando');

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
    async run(message, args){
      
      var client = message.client;
      message.channel.send(client.RaidManager.listFormatted());
    }
}

module.exports = raids;
