"use strict";

/*global Promise*/

const RaidsParser = require("./raidsParser");
const Raid = require("./raid");

let RaidChannel = function (raidManager, channel, raidsCommand, config) {
    this.raidManager = raidManager;
    this.channel = channel;

    let command = (raidsCommand ? RaidsParser.tryParse(raidsCommand) : undefined);
    if (command) {
        this.filter = command.filter;
        this.filterDescription = command.filterDescription;
        this.chooseBest = (!command.city && !command.all);
        this.lookupOptions = config.getEffectiveGymLookupOptionsForChannel(channel);
    }
    else {
        this.filter = function () { return true; };
        this.filterDescription = undefined;
        this.chooseBest = true;
        this.lookupOptions = config.getEffectiveGymLookupOptionsForChannel(channel);
    }
    this.status = "";
};

RaidChannel.prototype.update = function () {
    let self = this;

    let raids = this.raidManager.list(this.filter);
    if (this.chooseBest && this.lookupOptions) {
        raids = this.raidManager.chooseBestRaidsForLookupOptions(raids, this.lookupOptions);
    }
    this.status = Raid.getFormattedRaidListOutputAsString(raids, { description: this.filterDescription });

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
