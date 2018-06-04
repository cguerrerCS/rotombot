"use strict";

const RaidsParser = require("./raidsParser");

let RaidChannel = function (raidManager, channel, raidsCommand) {
    this.raidManager = raidManager;
    this.channel = channel;

    let command = (raidsCommand ? RaidsParser.tryParse(raidsCommand) : undefined);
    if (command) {
        this.filter = command.filter;
        this.filterDescription = command.filterDescription;
    }
    else {
        this.filter = function () { return true; };
        this.filterDescription = undefined;
    }
    this.status = "";
};

RaidChannel.prototype.update = function () {
    this.status = this.raidManager.listFormatted(this.filter, this.filterDescription);
    this.channel.fetchMessages().then((messages) => {
        this.channel.bulkDelete(messages);
    }).then(() => {
        this.channel.send(this.status);
    }).catch(console.error);
};

module.exports = RaidChannel;
