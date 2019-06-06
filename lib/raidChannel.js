"use strict";

/*global Promise*/

const RaidsCommand = require("./raidsCommand");

let RaidChannel = function (raidManager, channel, raidsCommand, config) {
    this.raidManager = raidManager;
    this.channel = channel;
    this.lookupOptions = config.getEffectiveGymLookupOptionsForChannel(channel);

    try {
        this.command = (raidsCommand ? new RaidsCommand(raidsCommand || "!raids", this.raidManager) : undefined);
    }
    catch (err) {
        this.failedCommand = raidsCommand;
        this.failedCommandRetries = 3;
        console.log(`Raid channel for ${raidsCommand} failed with ${err}`);
    }

    if (!this.command) {
        this.command = new RaidsCommand("!raids", this.raidManager);
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

RaidChannel.prototype.retryFailedCommand = function () {
    if (this.failedCommand && (this.failedCommandRetries > 0)) {
        let newCommand = null;
        try {
            newCommand = new RaidsCommand(this.failedCommand, this.raidManager);
        }
        catch (err) {
            console.log(`Retry for "${this.failedCommand}" failed with ${err}`);
        }

        if (newCommand) {
            console.log(`Retry succeeded for "${this.failedCommand}"`);
            this.command = newCommand;
        }

        this.failedCommandRetries--;

        if (this.failedCommandRetries-- < 1) {
            this.failedCommand = undefined;
        }
    }
};

const _thumbsUp = "👍";
const _thumbsDown = "👎";
const _watch = "⌚";
const _reactions = [_thumbsUp, _thumbsDown, _watch];

RaidChannel.prototype.addReactions = function (msg, raid) {
    if (raid) {
        const self = this;
        const filter = (reaction, user) => {
            let ok = _reactions.includes(reaction.emoji.name);
            ok = ok && (user.id !== msg.author.id);
            return ok;
        };
        const timeLeft = raid.expiryTime.getTime() - Date.now();
        const collector = msg.createReactionCollector(filter, { time: timeLeft });

        collector.on("collect", (r) => {
            return r.fetchUsers().then((users) => {
                const promises = users.map((user) => {
                    let result = Promise.resolve(undefined);
                    if (user.id !== msg.author.id) {
                        let raiderInfo = {
                            raiderName: user.username,
                            gym: undefined,
                            etaTime: undefined,
                            arrivalTime: undefined,
                            startTime: undefined,
                            endTime: undefined,
                            code: undefined,
                        };
                        if (r.emoji.name === _watch) {
                            const raider = self.raidManager.tryGetRaider(raid.gym, raiderInfo.raiderName);
                            const currentEta = Math.max(((raider && raider.getEstimatedArrivalTime()) || raid.hatchTime).getTime(), Date.now());
                            const newEta = currentEta + (5 * 60 * 1000);
                            if (raid.expiryTime.getTime() > newEta) {
                                raiderInfo.etaTime = newEta;
                                result = new Promise(() => self.raidManager.addOrUpdateRaider(raid.gym, raiderInfo));
                            }
                        }
                        else if (r.emoji.name === _thumbsUp) {
                            result = new Promise(() => self.raidManager.addOrUpdateRaider(raid.gym, raiderInfo));
                        }
                        else if (r.emoji.name === _thumbsDown) {
                            result = new Promise(() => self.raidManager.removeRaider(raid.gym, raiderInfo.raiderName));
                        }
                    }
                    return result;
                });
                return Promise.all(promises);
            });
        });

        collector.on("end", (collected) => {
            console.log(`Collected ${collected.size} items`);
        });
        return msg.react(_thumbsUp).then(() => msg.react(_watch)).then(() => msg.react(_thumbsDown));
    }
    return Promise.resolve();
};

RaidChannel.prototype.update = function () {
    let self = this;

    if (this.failedCommand) {
        this.retryFailedCommand();
    }

    let want = this.command.getMessages(this.lookupOptions);
    this.channel.fetchMessages().then((haveMessages) => {
        let foundAll = false;

        let have = haveMessages.array();
        if (have.length === want.length) {
            foundAll = true;
            for (let i = 0; (i < want.length) && foundAll; i++) {
                foundAll = foundAll && messagesMatch(want[i].message, have[i]);
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
                update.toShow.forEach((raidMessage) => {
                    self.channel.send(raidMessage.message.embed ? raidMessage.message : raidMessage.message.content)
                        .then((m) => this.addReactions(m, raidMessage.raid))
                        .catch(console.log);
                });
            }
        }).catch(console.log);
    }).catch((err) => {
        console.error(`Updating messages (${self.filterDescription}) failed with ${err}.`);
    });
};

module.exports = RaidChannel;
