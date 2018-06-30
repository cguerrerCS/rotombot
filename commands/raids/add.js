"use strict";

const commando = require("discord.js-commando");
const Raid = require("../../lib/raid");

const addEggByStartTimeRegex = /^!add\s+(?:(?:L|T)?(\d+)\s+)?(\w+(?:\s|\w)*)(?:\s+(?:@|at)\s*)((?:\d?\d):?(?:\d\d)\s*(?:a|A|am|AM|p|P|pm|PM)?)$/;
const addEggByTimerRegex = /^!add\s+(?:(?:L|T)?(\d+)\s+)?(\w+(?:\s|\w)*)(?:\s+(?:in)\s*)(\d?\d)\s*?$/;
const addBossWithTimerRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s)*)(?:\s+(\d?\d)\s*(?:left))\s*?$/;
const addBossWithTimerAltRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s)*)(?:for)(?:\s+(\d?\d)\s*)\s*?$/;
const addBossNoTimerRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s)*)$/;

const eggStartTimeSampleIndex = 1;
const eggTimerSampleIndex = 5;
const bossWithTimerLeftSampleIndex = 9;
const bosswithTimerForSampleIndex = 12;

//!add command
class raid extends commando.Command {
    constructor(client) {
        super(client, {
            name: "add",
            group: "raids",
            memberName: "add",
            description: "add raid or boss to active raids list",
            examples: [
                "Add an unhatched egg with start time and optional tier:",
                "  !add [<tier>] <location> (at|@) <time>",
                "  !add wells fargo at 1012",
                "  !add 4 wells fargo at 1012",
                "Add an unhatched egg with time-to-hatch and an optional tier:",
                "  !add [<tier>] <location> in <minutes>",
                "  !add library in 20",
                "  !add 4 library in 20",
                "Add or update an active raid:",
                "  !add <pkmn> (at|@) <location> <minutes> left",
                "  !add ho-oh at Luke McRedmond 30 left",
                "or:",
                "  !add <pkmn> (at|@) <location> for <minutes>",
                "  !add latias at wells for 10",
                "Add a boss to an hatched egg:",
                "  !add <pkmn> (at|@) <location>",
                "  !add ttar at wells",
                "Where:",
                "  Time is 12- or 24-hour format with optional colon. If am/pm is",
                "  omitted for 12-hour, the upcoming time is assumed:",
                "     12:10pm - 10 minutes after noon",
                "     06:15 - 6:15 AM",
                "     9:15 - either 9:15 AM or 9:15 PM",
                "  Tier is 1-5",
                "  Unhatched egg timer is 1-60",
                "  Active raid timer is 1-45",
            ],
        });
    }


    async run(message) {
        const client = message.client;
        const output = `Processing !add command submitted by user ${message.author}\n`;
        console.log("[Raid Manager] command: " + message.content);
        // process.stdout.write(output);
        message.channel.send(output);

        if (message.channel.type.toString() === "dm") {
            client.reportError(message, "!raid", "cannot add active raids via DMs.");
            return;
        }

        let lookupOptions = client.config.getEffectiveGymLookupOptionsForMessage(message) || {};

        let match = message.content.match(addEggByStartTimeRegex);
        if (match !== null) {
            const [, tier, gym, startTime] = match;
            try {
                let added = client.raidManager.addEggAbsolute(tier, gym, startTime, lookupOptions);
                message.channel.send(`Added ${Raid.raidToString(added)}.\n`);
            }
            catch (e) {
                client.reportError(message, "!add", e, this.examples[eggStartTimeSampleIndex]);
            }
            return;
        }

        match = message.content.match(addEggByTimerRegex);
        if (match !== null) {
            const [, tier, gym, timer] = match;
            try {
                let added = client.raidManager.addEggCountdown(tier, gym, timer, lookupOptions);
                message.channel.send(`Added ${Raid.raidToString(added)}.\n`);
            }
            catch (err) {
                client.reportError(message, "!add", err, this.examples[eggTimerSampleIndex]);
                return;
            }
            return;
        }

        match = message.content.match(addBossWithTimerRegex) || message.content.match(addBossWithTimerAltRegex);
        if (match !== null) {
            const [, boss, gym, timer] = match;

            try {
                let added = client.raidManager.addRaid(boss, gym, timer, lookupOptions);
                message.channel.send(`Added ${Raid.raidToString(added)}.\n`);
            }
            catch (err) {
                let commandSyntax = this.examples[bosswithTimerForSampleIndex] + "\nOR\n" + this.examples[bossWithTimerLeftSampleIndex];
                client.reportError(message, "!add", err, commandSyntax);
                return;
            }
            return;
        }

        match = message.content.match(addBossNoTimerRegex);
        if (match !== null) {
            const [, boss, gym] = match;
            try {
                let updated = client.raidManager.setRaidBoss(boss, gym, lookupOptions);
                message.channel.send(`Updated ${Raid.raidToString(updated)}.\n`);
            }
            catch (err) {
                // If we get this error, the raid is likely not in the active list, so give the
                // help for adding the raid.
                client.reportError(message, "!add", err, this.examples[bosswithTimerForSampleIndex] + "\nOR\n" + this.examples[bossWithTimerLeftSampleIndex]);
                return;
            }
            return;
        }

        client.reportError(
            message,
            "!add",
            "My circuitzzz are tingling! I didn't understand that command...",
            "Try:\n" + this.examples[eggStartTimeSampleIndex] + "\nOR\n" + this.examples[bossWithTimerLeftSampleIndex]);
    }
}

module.exports = raid;
