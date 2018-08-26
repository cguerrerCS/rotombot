"use strict";

const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const RaidManager = require("./lib/raidManager.js");
const ConfigManager = require("./lib/configManager");
const HookManager = require("./lib/hookManager");
const RaidChannel = require("./lib/raidChannel");
const Utils = require("./lib/utils");

const { CommandoClient } = require("discord.js-commando");
const botConfig = getBot();
const botName = botConfig.name;
const isDevelopment = botConfig.isDevelopment;

//Discord related commands
const client = new CommandoClient({
    _commandPrefix: "!",
});

client.registry.registerGroup("raids", "Raids");
client.registry.registerGroup("player", "Player");
client.registry.registerDefaults();
client.registry.registerCommandsIn(path.resolve("./commands"));

const CsvReader = require("csv-reader");
let inputRaidDataStream = fs.createReadStream("data/Gyms.csv", "utf8");

let inputRaidBossDataStream = fs.createReadStream("data/Bosses.csv", "utf8");
let inputModeratorIdStream = fs.createReadStream("ModeratorId.csv", "utf8");

let raidManager = new RaidManager({ logger: console });

let moderatorData = [];
let moderatorId = undefined;

if (!botConfig.discordToken) {
    let inputBotTokenStream = fs.createReadStream("BotToken.csv", "utf8");
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
            const token = tokens[botName].token;
            client.login(token).catch((err) => {
                console.log(`Login failed with ${err} - retrying.`);
                client.login(token).catch((err) => {
                    throw new Error(`Login failed after retry with ${err}. Terminating.`); 
                });
            });
        });
}
else {
    const token = botConfig.discordToken;
    client.login(token).catch((err) => {
        console.log(`Login failed with ${err} - retrying.`);
        client.login(token).catch((err) => {
            throw new Error(`Login failed after retry with ${err}. Terminating.`); 
        });
    });
}


function reportError(message, cmd, error, syntax) {
    let output = "Zzz-zzt! Could not process " + cmd + " command submitted by " + message.author + "\n*error: " + error + "*\n";

    console.log("syntax " + syntax);

    if (syntax) {
        output = output + "\n **__SAMPLE COMMAND:__** ```" + syntax + "```";
    }

    process.stdout.write(output);
    message.channel.send(output);
}

function getBot() {
    let config = path.resolve("data/BotConfig.json");
    if (fs.existsSync(config)) {
        return require(config).default;
    }
    return { name: "Rotom", isDevelopment: false };
}

function getModeratorId() {
    return moderatorId;
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
                    let raidChannel = new RaidChannel(client.raidManager, channel, channel.topic, client.config);
                    client.raidManager.addRaidChannel(raidChannel);
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

// on client ready, load in any data and setup raid manager
client.on("ready", () => {
    process.stdout.write(`Bot logged in as ${client.user.tag}! Listening...\n`);
    client.reportError = reportError;
    client.isDevelopment = isDevelopment;
    client.botName = botName;
    client.raidManager = raidManager;
    client.getModeratorId = getModeratorId;
    client.config = new ConfigManager({ logger: console });
    client.hooks = new HookManager(client, botConfig.hooks);
    client.raidManager.hooks = client.hooks;

    addRaidChannels();

    client.raidManager.initGymDataAsync(inputRaidDataStream);

    Utils.processCsvAsync(inputRaidBossDataStream,
        (row) => {
            return {
                name: row[0],
                id: row[1],
                tier: row[2],
                image: row[3],
                status: row[4],
            };
        },
        (collection) => {
            client.raidManager.setBossData(collection);
        });

    inputModeratorIdStream
        .pipe(CsvReader({ parseNumbers: false, parseBooleans: true, trim: true, skipHeader: true }))
        .on("data", function (row) {
            let modObj = {
                name: row[0],
                id: row[1],
            };
            moderatorData[modObj.name] = modObj;
            moderatorData.push(modObj);
        })
        .on("end", function () {
            moderatorId = moderatorData.DeusTechnica.id;
        });
});
