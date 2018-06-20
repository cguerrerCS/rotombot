"use strict";

const path = require("path");
const Discord = require("discord.js");
const RaidManager = require("./lib/raidManager.js");
const ServerConfigManager = require("./lib/serverConfigManager");
const UserConfigManager = require("./lib/userConfigManager.js");
const RaidChannel = require("./lib/raidChannel");
const Utils = require("./lib/utils");

const { CommandoClient } = require("discord.js-commando");
const isDevelopment = false;

//Discord related commands
const client = new CommandoClient({
    _commandPrefix: "!",
});

client.registry.registerGroup("raids", "Raids");
client.registry.registerGroup("player", "Player");
client.registry.registerDefaults();
client.registry.registerCommandsIn(path.resolve("./commands"));

const fs = require("fs");
const CsvReader = require("csv-reader");
let inputRaidDataStream = fs.createReadStream("data/Gyms.csv", "utf8");
let inputBotTokenStream = fs.createReadStream("BotToken.csv", "utf8");
let inputRaidBossDataStream = fs.createReadStream("RaidBosses.csv", "utf8");

let raidManager = new RaidManager();
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

function addRaidChannels() {
    let output = [];
    for (let kvp of client.channels) {
        let channel = kvp[1];
        if (channel.type === "text") {
            let permissions = channel.permissionsFor(client.user);
            let canManage = permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES);
            let canSend = permissions.has(Discord.Permissions.FLAGS.SEND_MESSAGES);
            let canRead = permissions.has(Discord.Permissions.FLAGS.READ_MESSAGES);
            let canReadHistory = permissions.has(Discord.Permissions.FLAGS.READ_MESSAGE_HISTORY);
            if (canRead && canSend) {
                if (canManage && canReadHistory && channel.topic && channel.topic.startsWith("!raids ")) {
                    let raidChannel = new RaidChannel(client.raidManager, channel, channel.topic);
                    client.raidManager.addRaidChannel(raidChannel);
                    raidChannel.update();
                    output.push(`    Reporting on ${channel.guild.name}/${channel.name} [${channel.topic}]\n`);
                }
                else {
                    output.push(`    Listening on ${channel.guild.name}/${channel.name}\n`);
                }
            }
        }
    }

    if (output.length > 0) {
        console.log("Serving channels:\n");
        output.sort();
        output.forEach((line) => console.log(line));
    }
}

function getConfigForMessage(message) {
    let user = this.user.tryGetUser(message.member.id);
    let server = this.server.tryGetServer(message.guild.id);
    return user ? user.getEffectiveOptions(server) : server;
}

// on client ready, load in any data and setup raid manager
client.on("ready", () => {
    process.stdout.write(`Bot logged in as ${client.user.tag}! Listening...\n`);
    client.reportError = reportError;
    client.isDevelopment = isDevelopment;
    client.raidManager = raidManager;
    client.config = {
        server: new ServerConfigManager("./data/Servers.json"),
        user: new UserConfigManager("./state/userConfigs.json"),
        getConfigForMessage: getConfigForMessage,
    };

    addRaidChannels();

    client.raidManager.initGymDataAsync(inputRaidDataStream);

    Utils.processCsvAsync(inputRaidBossDataStream,
        (row) => {
            return {
                name: row[0],
                tier: row[1],
                status: row[2],
            };
        },
        (collection) => {
            client.raidManager.setBossData(collection);
        });
});
