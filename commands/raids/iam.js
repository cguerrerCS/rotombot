"use strict";
const commando = require("discord.js-commando");

const omwNoEtaRegex = /^!iam\s+omw\s+(?:to\s+)?(\w+(?:\s|\w)*)\s*$/i;
const omwEtaRegex = /^!iam\s+omw\s+(?:to\s+)?(\w+(?:\s|\w)*)\s+eta\s+((?:\d\d?)|((?:\d?\d):?(?:\d\d)\s*(?:a|A|am|AM|p|P|pm|PM)?)|hatch)\s*$/i;
const omwStartWithCodeRegex = /^!iam\s+(?:start|starting)\s+(?:(?:at|@)\s+)?(\w+(?:\s|\w)*)\s*(?:\s+code\s+(\w(?:\w|\s)*))/i;
const omwStartNoCodeRegex = /^!iam\s+(?:start|starting)\s+(?:(?:at|@)\s+)?(\w+(?:\s|\w)*)\s*/i;
const omwOtherRegex = /^!iam\s+(here|done|skipping)(?:\s+(?:at|@))?\s+(\w+(?:\s|\w)*)$/i;

const omwNoEtaExampleIndex = [2];
const omwEtaExampleIndexes = [5, 6, 7];
const omwHereExampleIndex = [10];
const omwStartExampleIndexes = [13, 14];
const omwDoneExampleIndex = [17];
const omwCanceExampleIndex = [20];

//!raids command
class raids extends commando.Command {
    constructor(client) {
        super(client, {
            name: "iam",
            group: "raids",
            memberName: "iam",
            description: "RSVP for a raid, report location and status",
            examples: [
                "On my way (no eta):",
                "  !iam omw [to] <gym>",
                "  !iam omw to painted",
                "On my way with ETA as absolute or delta:",
                "  !iam omw [to] <gym> eta (<minutes>|<time>|hatch)",
                "  !iam omw to market eta 20",
                "  !iam omw to market eta 1130",
                "  !iam omw to market eta hatch",
                "Arrived at the raid:",
                "  !iam here [at|@] <gym> OR",
                "  !iam here at market",
                "Started the raid:",
                "  !iam starting [at|@] <gym> [code <optional message>]",
                "  !iam starting luke",
                "  !iam starting soul foods code mystic pika pika bulba",
                "Finished the raid:",
                "  !iam done [at|@] <gym>",
                "  !iam done at soul foods",
                "Cancel an RSVP",
                "  !iam skipping <gym>",
                "  !iam skipping luke",
            ],
        });
    }

    async run(message) {
        let client = message.client;

        let wantGym = undefined;
        let raiderInfo = {
            raiderName: message.member.user.username,
            gym: undefined,
            etaTime: undefined,
            arrivalTime: undefined,
            startTime: undefined,
            endTime: undefined,
            code: undefined,
        };
        let helpExamples = 0;

        let match = message.content.match(omwEtaRegex);

        if (match !== null) {
            console.log(`on my way with eta: ${match}\n`);
            let [, gymName, wantTime] = match;
            wantGym = gymName;
            raiderInfo.etaTime = wantTime;
            helpExamples = omwEtaExampleIndexes;
        }
        else {
            match = message.content.match(omwStartWithCodeRegex);
            if (match === null) {
                match = message.content.match(omwStartNoCodeRegex);
            }
            if (match !== null) {
                console.log(`started raid: ${match}\n`);
                let [, gymName, wantCode] = match;
                wantGym = gymName;
                raiderInfo.startTime = new Date();
                raiderInfo.code = wantCode;
                helpExamples = omwStartExampleIndexes;
            }
            else {
                match = message.content.match(omwOtherRegex);
                if (match !== null) {
                    console.log(`omw other: ${match}`);
                    let [, verb, gymName] = match;
                    wantGym = gymName;
                    switch (verb.toLowerCase()) {
                        case "here":
                            raiderInfo.arrivalTime = new Date();
                            helpExamples = omwHereExampleIndex;
                            break;
                        case "done":
                            raiderInfo.endTime = new Date();
                            helpExamples = omwDoneExampleIndex;
                            break;
                        case "never":
                            raiderInfo = undefined;
                            helpExamples = omwCanceExampleIndex;
                            break;
                        default:
                            client.reportError(message, "!omw", `My circuitzzz are tingling! I didn't recognize the verb "${verb}"`);
                            return;
                    }
                }
                else {
                    match = message.content.match(omwNoEtaRegex);
                    if (match === null) {
                        client.reportError(
                            message,
                            "!add",
                            "My circuitzzz are tingling! I didn't understand that command..."
                        );
                        return;
                    }
                    console.log(`omw no eta: ${match}`);
                    let [, gymName] = match;
                    wantGym = gymName;
                    helpExamples = omwNoEtaExampleIndex;
                }
            }
        }

        try {
            if (raiderInfo) {
                let raid = client.raidManager.addOrUpdateRaider(wantGym, raiderInfo);
                message.channel.send(`${raid.gym.name}: ${raid.raiders[raiderInfo.raiderName].toString()}`);
            }
            else {
                let raid = client.raidManager.removeRaider(wantGym, message.member.user.username);
                message.channel.send(`${raid.gym.name}: Cancelled rsvp for ${message.member.user.username}`);
            }
        }
        catch (err) {
            let help = "";
            helpExamples.forEach((i) => {
                help += this.examples[i] + "\n";
            });
            client.reportError(message, "!omw", err, help);
        }
    }
}

module.exports = raids;
