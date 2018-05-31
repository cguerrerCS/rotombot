"use strict";
const commando = require("discord.js-commando");
const { FlexTime } = require("botsbits");

const noEtaRegex = /^!omw\s+(?:to\s+)(\w+(?:\s|\w)*)\s*$/i;
const omwEtaRegex = /^!omw\s+(?:to\s+)(\w+(?:\s|\w)*)+\s+eta\s+((?:\d\d?)|((?:\d?\d):?(?:\d\d)\s*(?:a|A|am|AM|p|P|pm|PM)?))\s*$/i;
const omwInRegex = /^!omw\s+(\w+)\s+in\s+(\w*)\s*$/i;
const omwOtherRegex = /^!omw\s+(\w+)\s+(never|here|done)\s*$/i;

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
                "On my way with ETA as absolute or delta:",
                "  !omw [to] <gym> eta (<minutes>|<time>)",
                "Arrived at the raid:",
                "  !omw here",
                "Started the raid:",
                "  !omw in <optional message>",
                "Finished the raid:",
                "  !omw done",
            ],
        });
    }

    async run(message) {
        let client = message.client;

        let raiderInfo = {
            name: message.member.user.username,
            etaTime: undefined,
            arrivalTime: undefined,
            startTime: undefined,
            endTime: undefined,
            code: undefined,
        };

        let match = message.content.match(omwEtaRegex);
        if (match !== null) {
            console.log(`on my way with eta: ${match}\n`);
            let [, wantGym, wantTime] = match;
            if (wantTime.length < 3) {
                raiderInfo.etaTime = new Date(Date.now() + (wantTime * 60 * 1000));
            }
            else {
                raiderInfo.etaTime = new FlexTime(wantTime).toDate();
            }
            try {
                let raid = client.raidManager.addOrUpdateRaider(wantGym, raiderInfo);
                message.channel.send(`Added ${raiderInfo.name} as attending ${raid.gym.name} with eta ${raiderInfo.etaTime}.`);
            }
            catch (e) {
                client.reportError(message, "!omw", e);
            }
        }
        else {
            match = message.content.match(omwInRegex);
            if (match !== null) {
                console.log(`started raid: ${match}\n`);
            }
            else {
                match = message.content.match(omwOtherRegex);
                if (match !== null) {
                    console.log(`omw other: ${match}`);
                }
                else {
                    match = message.content.match(noEtaRegex);
                    if (match === null) {
                        client.reportError(
                            message,
                            "!add",
                            "My circuitzzz are tingling! I didn't understand that command..."
                        );
                        return;
                    }
                    console.log(`omw no eta: ${match}`);
                    let [, wantGym] = match;
                    try {
                        let raid = client.raidManager.addOrUpdateRaider(wantGym, raiderInfo);
                        message.channel.send(`Added ${raiderInfo.name} as attending ${raid.gym.name} with no eta.`);
                    }
                    catch (e) {
                        client.reportError(message, "!omw", e);
                    }
                }
            }
        }
    }
}

module.exports = raids;
