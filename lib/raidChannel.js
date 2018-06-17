"use strict";

const RaidsParser = require("./raidsParser");
const Raid = require("./raid");

let RaidChannel = function (raidManager, channel, raidsCommand, botUser) {
    this.raidManager = raidManager;
    this.channel = channel;
    this.user = botUser;

    let command = (raidsCommand ? RaidsParser.tryParse(raidsCommand) : undefined);
    if (command) {
        this.filter = command.filter;
        this.filterDescription = command.filterDescription;
        this.showDirections = command.showDirections;
        this.showRsvps = command.showRsvps;
    }
    else {
        this.filter = function () { return true; };
        this.filterDescription = undefined;
    }
    this.status = "";
};

RaidChannel.prototype.update = function () {
    let self = this;
    this.status = "";

    if (self.showDirections || self.showRsvps) {
        let messages = [];
        self.raidManager.list(this.filter).forEach((raid) => {
            messages.push(Raid.toDiscordMessage(raid));
        });
        self.channel.fetchMessages().then((m) => self.channel.bulkDelete(m)).then(() => {
            messages.forEach((m) => {
                self.channel.send(m);
            });
        }).catch((err) => {
            console.error(`Updating messages (${self.filterDescription}) failed with ${err}.`);
        });
        return;
    }

    /*
    if (this.showRsvps) {
        let rsvps = this.raidManager.listRsvpsFormatted(this.filter);
        if (rsvps && rsvps.length > 0) {
            this.status += `Raider Status:\n${rsvps}`;
        }
    }
    */

    this.status += this.raidManager.listFormatted(this.filter, this.filterDescription);

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
};

module.exports = RaidChannel;
