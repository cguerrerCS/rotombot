"use strict";

const RaidManager = require("./lib/raidManager.js");
const { CommandoClient } = require("discord.js-commando");
const isDevelopment = true;

//Discord related commands
const client = new CommandoClient({
    _commandPrefix: "!",
});

client.registry.registerGroup("raids", "Raids");
client.registry.registerDefaults();
client.registry.registerCommandsIn(__dirname + "/commands");

const fs = require("fs");
const CsvReader = require("csv-reader");
let inputRaidDataStream = fs.createReadStream("RaidLocations.csv", "utf8");
let inputBotTokenStream = fs.createReadStream("BotToken.csv", "utf8");
let inputRaidBossDataStream = fs.createReadStream("RaidBosses.csv", "utf8");

let raidManager = new RaidManager();
let raidData = [];
let raidBossData = [];
let tokens = {};

// Login logic for the bot:
// read in bot tokens
inputBotTokenStream
    .pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
    .on("data", function (row) {
        let tokenObj = {
            botName: row[0],
            token: row[1],
            clientID: row[2],
        };
        tokens[tokenObj.botName] = tokenObj;
    })
    .on("end", function () {
        if (isDevelopment) {
            let token = tokens["Rotom Jr."].token;
            client.login(token);
        }
        else {
            let token = tokens.Rotom.token;
            client.login(token);
        }
    });

function reportError(message, cmd, error, syntax) {
    let output = "Zzz-zzt! Could not process " + cmd + " command submitted by " + message.author + "\n*error: " + error + "*\n";

    console.log("syntax " + syntax);

    if (syntax) {
        output = output + "\n **__SAMPLE COMMAND:__** ```" + syntax + "```";
    }

    process.stdout.write(output);
    message.channel.send(output);
}

// on client ready, load in any data and setup raid manager
client.on("ready", () => {
    process.stdout.write(`Bot logged in as ${client.user.tag}! Listening...\n`);
    client.reportError = reportError;
    client.isDevelopment = isDevelopment;
    client.raidManager = raidManager;

    // read in all raid data
    inputRaidDataStream
        .pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
        .on("data", function (row) {
            let data = {
                city: row[0],
                name: row[1],
                friendlyName: row[2],
                lng: row[3],
                lat: row[4],
                mapLink: `https://www.google.com/maps/dir/?api=1&destination=${row[3]},${row[4]}`,
            };
            raidData.push(data);
        })
        .on("end", function () {
            client.raidManager.setGymData(raidData);
        });

    inputRaidBossDataStream
        .pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
        .on("data", function (row) {
            let data = {
                name: row[0],
                tier: row[1],
            };
            raidBossData.push(data);
        })
        .on("end", function () {
            client.raidManager.setBossData(raidBossData);
        });
});
