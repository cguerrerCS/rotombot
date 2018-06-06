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
    let self = this;
    this.status = this.raidManager.listFormatted(this.filter, this.filterDescription);
    this.channel.fetchMessages().then((messages) => {
        let found = false;
        messages.forEach((message) => {
            let existingContent = (message ? message.content : undefined);
            if ((!found) && (existingContent.trim() === self.status.trim())) {
                found = true;
            }
            else {
                message.delete();
            }
        });

        return (found ? Promise.resolve(true) : this.channel.send(self.status));
    }).catch(console.error);
};

module.exports = RaidChannel;
