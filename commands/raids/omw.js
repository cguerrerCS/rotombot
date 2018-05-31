"use strict";
const commando = require("discord.js-commando");
const RaidManager = require("../../lib/raidManager");

const omwNoEtaRegex = /^!omw\s+(?:to\s+)?(\w+(?:\s|\w)*)\s*$/i;
const omwEtaRegex = /^!omw\s+(?:to\s+)?(\w+(?:\s|\w)*)\s+eta\s+((?:\d\d?)|((?:\d?\d):?(?:\d\d)\s*(?:a|A|am|AM|p|P|pm|PM)?)|hatch)\s*$/i;
const omwStartRegex = /^!omw\s+(?:to\s+)?(\w+(?:\s|\w)*)\s+(?:starting|start)\s*(\w+(?:\s|\w)*)*\s*$/i;
const omwOtherRegex = /^!omw\s+(?:to\s+)?(\w+(?:\s|\w)*)\s+(never|here|done)\s*$/i;

const omwNoEtaExampleIndex = 2;
const omwEtaExampleIndexes = [5, 6, 7];
const omwHereExampleIndex = 10;
const omwStartExampleIndexes = [13, 14];
const omwDoneExampleIndex = 17;
const omwCanceExampleIndex = 20;

//!raids command
class raids extends commando.Command {
    constructor(client) {
        super(client, {
            name: "omw",
            group: "raids",
            memberName: "omw",
            description: "RSVP for a raid",
            examples: [
                "On my way (no eta):",
                "  !omw [to] <gym>",
                "  !omw to painted",
                "On my way with ETA as absolute or delta:",
                "  !omw [to] <gym> eta (<minutes>|<time>|hatch)",
                "  !omw to market eta 20",
                "  !omw to market eta 1130",
                "  !omw to market eta hatch",
                "Arrived at the raid:",
                "  !omw [to] <gym> here",
                "  !omw market here",
                "Started the raid:",
                "  !omw [to] <gym> start <optional message>",
                "  !omw luke start",
                "  !omw soul foods start mystic pika pika bulba",
                "Finished the raid:",
                "  !omw [to] <gym> done",
                "  !omw soul foods done",
                "Cancel an RSVP",
                "  !omw [to] <gym> never",
                "  !omw to luke never",
            ],
        });
    }

    async run(message) {
        let client = message.client;

        let wantGym = undefined;
        let raiderInfo = {
            name: message.member.user.username,
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
            match = message.content.match(omwStartRegex);
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
                    let [, gymName, verb] = match;
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
                message.channel.send(`${raid.gym.name}: ${RaidManager.formatRaider(raid.raiders[raiderInfo.name])}`);
            }
            else {
                let raid = client.raidManager.removeRaider(wantGym, message.member.user.username);
                message.channel.send(`${raid.gym.name}: Cancelled rsvp for ${message.member.user.username}`);
            }
        }
        catch (err) {
            let help = (typeof helpExamples === "number") ? this.examples[helpExamples] : "oops";
            client.reportError(message, "!omw", err, help);
        }
    }
}

module.exports = raids;
