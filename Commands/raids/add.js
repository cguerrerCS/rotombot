const commando = require('discord.js-commando');
const cmdParser = require('discord-command-parser');
const { FlexTime } = require('botsbits');

const addEggByStartTimeRegex = /^!add\s+(?:L?(\d+)\s+)?(\w+(?:\s|\w)*)(?:\s+(?:@|at)\s*)((?:\d?\d):?(?:\d\d)\s*(?:a|A|am|AM|p|P|pm|PM)?)$/;
const addEggByTimerRegex = /^!add\s+(?:L?(\d+)\s+)?(\w+(?:\s|\w)*)(?:\s+(?:in)\s*)(\d?\d)\s*?$/;
const addBossWithTimerRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s)*)(?:\s+(\d?\d)\s*(?:left))\s*?$/;
const addBossWithTimerAltRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s)*)(?:for)(?:\s+(\d?\d)\s*)\s*?$/;
const addBossNoTimerRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s)*)$/;

function getGym(client, location) {
    // Get closest result and add to raid list
    let searchResults = client.RaidsFuzzySearch.search(location);
    if (searchResults.length < 1)
    {
        client.ReportError(message, "!add", "no gym found matching search results");
        return undefined;
    }
    return searchResults[0];
}

//!add command
class raid extends commando.Command{
    constructor(client){
        super(client,{
            name: 'add',
            group: 'raids',
            memberName: 'add',
            description: 'add raid or boss to active raids list',
            examples: [
                'Add an unhatched egg with start time and optional tier:',
                '  !add [<tier>] <location> (at|@) <time>',
                '  !add wells fargo at 1012',
                '  !add 4 wells fargo at 1012',
                'Add an unhatched egg with time-to-hatch and an optional tier:',
                '  !add [<tier>] <location> in <minutes>',
                '  !add library in 20',
                '  !add 4 library in 20',
                'Add or update an active raid:',
                '  !add <pkmn> (at|@) <location> <minutes> left',
                '  !add ho-oh at Luke McRedmond 30 left',
                'or:',
                '  !add <pkmn> (at|@) <location> for <minutes>',
                '  !add latias at wells for 10',
                'Add a boss to an hatched egg:',
                '  !add <pkmn> (at|@) <location>',
                '  !add ttar at wells',
                'Where:',
                '  Time is 12- or 24-hour format with optional colon. If am/pm is',
                '  omitted for 12-hour, the upcoming time is assumed:',
                '     12:10pm - 10 minutes after noon',
                '     06:15 - 6:15 AM',
                '     9:15 - either 9:15 AM or 9:15 PM',
                '  Tier is 1-5',
                '  Unhatched egg timer is 1-60',
                '  Active raid timer is 1-45',
            ]
        })
    }

    async run(message) {

        const client = message.client;
        const output = `Processing !add command submitted by user ${message.author}\n`;
        process.stdout.write(output);
        message.channel.send(output);

        if (message.channel.type.toString() == "dm")
        {
            client.ReportError(message, "!raid", "cannot add active raids via DMs.");
            return;
        }

        let processed = false;

        let match = message.content.match(addEggByStartTimeRegex);
        if (match != null) {
            const [, tierSpec, location, timeSpec] = match;
            const tier = tierSpec || 5;
            if ((tier < 1) || (tier > 5)) {
                client.ReportError(message, "!add", "Tier must be 1-5.");
                return;
            }

            const time = new FlexTime(timeSpec);
            const delta = new FlexTime().getDeltaInMinutes(time);
            if (delta > 60) {
                client.ReportError(message, "!add", "That time is too far in the future.");
                return;
            }
            else if (delta < -2) {
                client.ReportError(message, "!add", "That time is too far in the past.");
                return;
            }
            
            // Get closest result and add to raid list
            let closestResult = getGym(client, location);
            if (!closestResult) {
                return;
            }

            client.RaidManager.addEggAbsolute(tier, closestResult.RaidLocation, time.toDate() );
            message.channel.send(client.RaidManager.listFormatted());
            return;
        }

        match = message.content.match(addEggByTimerRegex);
        if (match != null) {
            const [, tierSpec, location, timer] = match;
            const tier = tierSpec || 5;
            if ((tier < 1) || (tier > 5)) {
                client.ReportError(message, "!add", "Tier must be 1-5.");
                return;
            }

            if ((timer < 1) || (timer > 60)) {
                client.ReportError(message, "!add", "Timer must be 1-60 minutes.");
                return;
            }

            let closestResult = getGym(client, location);
            if (!closestResult) {
                return;
            }

            try {
                client.RaidManager.addEggCountdown(tier, closestResult.RaidLocation, timer );
                message.channel.send(client.RaidManager.listFormatted());
            } catch(err) {
                client.ReportError(message, "!add", err);
                return;
            }
            return;
        }

        match = message.content.match(addBossWithTimerRegex) || message.content.match(addBossWithTimerAltRegex);
        if (match !== null) {
            const [, boss, location, timer] = match;

            var pkmnSearchResults = client.RaidBossFuzzySearch.search(boss);
            if (pkmnSearchResults.length < 1) {
                client.ReportError(message, "!raid", "no pokemon name found in search results");
                return;
            }
            var closestPokemon = pkmnSearchResults[0];
            var tier = parseInt(closestPokemon.RaidTier.replace("Tier", "").trim());

            let closestResult = getGym(client, location);
            if (!closestResult) {
                return;
            }

            if ((timer < 1) || (timer > 45)) {
                client.ReportError(message, "!add", "Raid timer must be 1-45 minutes.");
                return;
            }

            try {
                client.RaidManager.addRaid(closestPokemon.RaidBoss, tier, closestResult.RaidLocation, timer);
                message.channel.send(client.RaidManager.listFormatted());
            } catch(err) {
                client.ReportError(message, "!add", err);
                return;
            }
            return;
        }

        match = message.content.match(addBossNoTimerRegex);
        if (match != null) {
            const [, boss, location] = match;

            var pkmnSearchResults = client.RaidBossFuzzySearch.search(boss);
            if (pkmnSearchResults.length < 1) {
                client.ReportError(message, "!raid", "no pokemon name found in search results");
                return;
            }
            var closestPokemon = pkmnSearchResults[0];
            var tier = parseInt(closestPokemon.RaidTier.replace("Tier", "").trim());

            let closestResult = getGym(client, location);
            if (!closestResult) {
                return;
            }

            try {
                client.RaidManager.setRaidBoss(closestPokemon.RaidBoss, tier, closestResult.RaidLocation);
                message.channel.send(client.RaidManager.listFormatted());
            } catch(err) {
                client.ReportError(message, "!add", err);
                return;
            }
            return;
        }

        client.ReportError(message, "!add", "My circuitzzz are tingling! I didn't understand that command...");
      }
}

module.exports = raid;
