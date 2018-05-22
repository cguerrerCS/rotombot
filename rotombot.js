const RaidManager = require('./raidmanager.js');
const { CommandoClient } = require('discord.js-commando');
const cmdParser = require('discord-command-parser');
const cmdPrefix = '!';
const IsDevelopment = false;

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

// testing adding seperate classes
//var myModule = require('./mymodule.js');
//var RaidManager = new myModule();
//client.RaidManager = RaidManager;

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



//var channel = client.servers.get("name", "Technica").defaultChannel;
//client.sendMessage(channel, "Hello world!");

/*
function RaidListRefresh()
{
	var now = new Date();

	for (var key in ActiveRaids)
	{
		var raid = ActiveRaids[key];
		if (now > raid.ExpiryTime)
		{
			process.stdout.write("Raid Expired: " + key + "\n");
			process.stdout.write("Time Now: " + now + "\n");
			process.stdout.write("Expiry: " + raid.ExpiryTime + "\n");
			delete ActiveRaids[key];
		}
	}
}*/

/*
function ProcessDirectionsCommand(message, args)
{
  if (args.length == 0)
  {
    ReportError(message, "!directions", "no gym name provided.");
    return;
  }

  var raidToGetDirectionsFor = args.join(' ').trim();
	var searchResults = fuse.search(raidToGetDirectionsFor);
	if (searchResults.length < 1)
	{
		ReportError(message, "!directions", "no gym found.");
		return;
	}

	var closestResult = searchResults[0];
	var directionsContent = closestResult.RaidLocation + " [Directions]\n" + closestResult.MapLink + "\n";
	message.channel.send(directionsContent);
}*/

/*
function ProcessRemoveCommand(message, args)
{
  if ((!IsDevelopment) && (message.channel.type.toString() == "dm"))
  {
    ReportError(message, "!remove", "cannot issue command from DMs.");
    return;
  }

  if (args.length == 0)
  {
    ReportError(message, "!remove", "no gym name provided.");
    return;
  }

  var raidToRemove = args.join(' ').trim();
	var searchResults = fuse.search(raidToRemove);
	if (searchResults.length < 1)
	{
		ReportError(message, "!remove", "no gym found.");
		return;
	}

	var closestResult = searchResults[0];
	if (closestResult.RaidLocation in ActiveRaids)
	{
		delete ActiveRaids[closestResult.RaidLocation];
		ProcessRaidsCommand(message);
	} else {
    ReportError(message, "!remove", closestResult.RaidLocation + " is not in raids list.");
    return;
  }
}
*/

function ReportError(message, cmd, error)
{
	var output = "Zzz-zzt! Could not process " + cmd + " command submitted by " + message.author + "\n*error: " + error + "*\n";
	process.stdout.write(output);
	message.channel.send(output);
}

/*
// Datetime to readable format
function FormatDateAMPM(date)
{
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+ minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}*/

// Raid list clean up, recurr every 10 seconds
// setInterval(RaidListRefresh, 10 * 1000);

client.on('ready', () => {

  process.stdout.write(`Logged in as ${client.user.tag}!\n`);
  process.stdout.write("listening for messages...\n");

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
    			threshold: 0.6,
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
        			threshold: 0.6,
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
          });


    // TODO: load add this on ready, Client Custom Properties
    client.RaidManager = new RaidManager();
    client.ReportError = ReportError;
    client.IsDevelopment = IsDevelopment;
    // client.FormatDateAMPM = FormatDateAMPM;
    // client.RaidsFuzzySearch = fuse;
});

client.on("message", async message => {

  /*
	if (!message.author.bot)
	{
		if (IsDevelopment)
		{
			if (message.channel.type.toString() == "dm")
			{
				ProcessDiscordMessage(message);
			}

		} else {

			ProcessDiscordMessage(message);
		}
	}*/
});
