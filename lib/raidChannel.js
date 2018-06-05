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
        let message = ((messages.size === 1) ? messages.first(1)[0] : undefined);
        let existingContent = (message ? message.content : undefined);
        let shouldUpdate = (existingContent !== this.status);
        if (shouldUpdate) {
            return this.channel.bulkDelete(messages).then(() => {
                return this.channel.send(this.status);
            });
        }
        return Promise.resolve(true);
    }).catch(console.error);
};

module.exports = RaidChannel;
