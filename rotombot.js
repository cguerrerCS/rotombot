const RaidManager = require('./raidmanager.js');
const { CommandoClient } = require('discord.js-commando');
const IsDevelopment = true;

//Discord related commands
const client = new CommandoClient({
    _commandPrefix: '!'
});

client.registry.registerGroup('raids','Raids');
client.registry.registerDefaults();
client.registry.registerCommandsIn(__dirname + "/Commands");

var fs = require('fs');
var CsvReadableStream = require('csv-reader');
var inputRaidDataStream = fs.createReadStream('RaidLocations.csv', 'utf8');
var inputBotTokenStream = fs.createReadStream('BotToken.csv', 'utf8');
var inputRaidBossDataStream = fs.createReadStream('RaidBosses.csv', 'utf8');
var Fuse = require('fuse.js');

var ActiveRaids = {};
var RaidData = [];
var RaidBossData = [];
var Tokens = {};
var Autocorrect = null;
var fuseRaidData = null;
var fuseRaidBossData = null;
var RotomRaidManager = new RaidManager();

// Login logic for the bot:
// read in bot tokens
inputBotTokenStream
    .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true , skipHeader: true}))
    .on('data', function (row) {

		var tokenObj =
		{
			BotName: row[0],
			Token: row[1],
			ClientID: row[2]
		};

		Tokens[tokenObj.BotName] = tokenObj;
    })
    .on('end', function (data) {

    	if (IsDevelopment) {
    		var token = Tokens["Rotom Jr."].Token;
    		client.login(token);
    	} else {
    		var token = Tokens["Rotom"].Token;
    		client.login(token);
    	}
    });

function ReportError(message, cmd, error, syntax)
{
	var output = "Zzz-zzt! Could not process " + cmd + " command submitted by " + message.author + "\n*error: " + error + "*\n";

	console.log("syntax " + syntax)

	if(syntax)
	{

		output = output + "\n **__SAMPLE COMMAND:__** ```" + syntax + "```";
	}

	process.stdout.write(output);
	message.channel.send(output);
}

// on client ready, load in any data and setup raid manager
client.on('ready', () => {

  process.stdout.write(`Bot logged in as ${client.user.tag}! Listening...\n`);
  client.ReportError = ReportError;
  client.IsDevelopment = IsDevelopment;
  client.RaidManager = RotomRaidManager;

  // read in all raid data
  inputRaidDataStream
      .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true , skipHeader: true}))
      .on('data', function (row) {

  		var data =
  		{
  			City: row[0],
  			RaidLocation: row[1],
  			FriendlyName: row[2],
  			Lng: row[3],
  			Lat: row[4],
  			MapLink: row[5]
  		};

  		RaidData.push(data);

      })
      .on('end', function (data) {

      	var options = {
      		shouldSort: true,
      		caseSensitive: false,
    			threshold: 0.5,
    			location: 0,
    			distance: 100,
    			maxPatternLength: 32,
    			minMatchCharLength: 1,
    			keys: [
      			"RaidLocation",
      			"FriendlyName"
  			]
  			};

  	    fuseRaidData = new Fuse(RaidData, options); // "RaidData" is the item array
        client.RaidsFuzzySearch = fuseRaidData;
        client.RaidManager.setRaidData(RaidData);
      });

  inputRaidBossDataStream
      .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true , skipHeader: true}))
      .on('data', function (row) {

  		var data =
  		{
  			RaidBoss: row[0],
  			RaidTier: row[1]
  		};

  		RaidBossData.push(data);

      })
      .on('end', function (data) {

      	var options = {
      		shouldSort: true,
      		caseSensitive: false,
    			threshold: 0.4,
    			location: 0,
    			distance: 100,
    			maxPatternLength: 32,
    			minMatchCharLength: 1,
    			keys: [
      			"RaidBoss"
  			]
  			};

  	    fuseRaidBossData = new Fuse(RaidBossData, options); // "RaidData" is the item array
        client.RaidBossFuzzySearch = fuseRaidBossData;
        client.RaidManager.setRaidBossData(RaidBossData);
      });
});
