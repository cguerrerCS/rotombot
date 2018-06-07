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
<<<<<<< HEAD
    this.status = this.raidManager.listFormatted(this.filter, this.filterDescription);
    this.channel.fetchMessages().then((messages) => {
        this.channel.bulkDelete(messages);
    }).then(() => {
        this.channel.send(this.status);
    }).catch(console.error);
=======
    let self = this;
    this.status = this.raidManager.listFormatted(this.filter, this.filterDescription);
    this.channel.fetchMessages().then((messages) => {
        let found = false;
        let messagesToDelete = false;
        messages.forEach((message) => {
            let existingContent = (message ? message.content : undefined);
            if ((!found) && (existingContent.trim() === self.status.trim())) {
                found = true;
            }
            else {
                messagesToDelete = true;
            }
        });

        return (found && !messagesToDelete ? undefined : messages);
    }).then((messages) => {
        if (messages) {
            let maybeDelete = (messages.size > 0) ? self.channel.bulkDelete(messages) : Promise.resolve(null);
            return maybeDelete.then(() => {
                return self.channel.send(self.status);
            });
        }
        return Promise.resolve(undefined);
    }).catch((err) => {
        console.error(`Updating messages (${self.filterDescription}) failed with ${err}.`);
    });
>>>>>>> master
};

module.exports = RaidChannel;
