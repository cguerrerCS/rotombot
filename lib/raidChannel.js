"use strict";

/*global Promise*/

const RaidsParser = require("./raidsParser");
const Raid = require("./raid");

let RaidChannel = function (raidManager, channel, raidsCommand, config) {
    this.raidManager = raidManager;
    this.channel = channel;
    this.lookupOptions = config.getEffectiveGymLookupOptionsForChannel(channel);

    this.command = (raidsCommand ? RaidsParser.tryParse(raidsCommand || "!raids") : undefined);
    if (!this.command) {
        this.command = RaidsParser.tryParse("!raids");
    }
    this.status = "";
};

function stringsMatch(want, have) {
    want = want ? want.trim() : undefined;
    have = have ? have.trim() : undefined;
    return want === have;
}

function messagesMatch(want, have) {
    if (want.embed) {
        let haveEmbed = (have.embeds.length > 0) ? have.embeds[0] : undefined;
        if (haveEmbed) {
            let match = stringsMatch(want.embed.title, haveEmbed.title);
            match = match && stringsMatch(want.embed.description, haveEmbed.description);
            match = match && stringsMatch((want.embed.footer || {}).text, (haveEmbed.footer || {}).text);
            match = match && (want.embed.fields.length === haveEmbed.fields.length);
            if (match && want.embed.fields.length > 0) {
                for (let i = 0; (i < want.embed.fields.length) && match; i++) {
                    match = match && stringsMatch(want.embed.fields[i].name, haveEmbed.fields[i].name);
                    match = match && stringsMatch(want.embed.fields[i].value, haveEmbed.fields[i].value);
                }
            }
            return match;
        }
    }
    else if (have.embeds.length === 0) {
        return stringsMatch(want.content, have.content);
    }
    return false;
}

RaidChannel.prototype.update = function () {
    let self = this;

    let want = RaidsParser.getMessagesForCommand(this.command, this.raidManager, this.lookupOptions);
    this.channel.fetchMessages().then((haveMessages) => {
        let foundAll = false;

        let have = haveMessages.array();
        if (have.length === want.length) {
            foundAll = true;
            for (let i = 0; (i < want.length) && foundAll; i++) {
                foundAll = foundAll && messagesMatch(want[i], have[i]);
            }
        }

        if (foundAll) {
            return {
                toDelete: undefined,
                toShow: undefined,
            };
        }
        else {
            return {
                toDelete: ((have.length > 0) ? haveMessages : undefined),
                toShow: want,
            };
        }
    }).then((update) => {
        let maybeDelete = update.toDelete ? self.channel.bulkDelete(update.toDelete) : Promise.resolve(null);
        return maybeDelete.then(() => {
            if (update.toShow && (update.toShow.length > 0)) {
                update.toShow.forEach((m) => {
                    self.channel.send(m.embed ? m : m.content).catch(console.log);
                });
            }
        }).catch(console.log);
    }).catch((err) => {
        console.error(`Updating messages (${self.filterDescription}) failed with ${err}.`);
    });
};

module.exports = RaidChannel;
