const Discord = require('discord.js');
const client = new Discord.Client();
const IsDevelopment = false;

var fs = require('fs');
var CsvReadableStream = require('csv-reader');
var inputRaidDataStream = fs.createReadStream('RaidLocations.csv', 'utf8');
var inputBotTokenStream = fs.createReadStream('BotToken.csv', 'utf8');
var Fuse = require('fuse.js');

var ActiveRaids = {};
var RaidData = [];
var Tokens = {};
var Autocorrect = null;
var fuse = null;

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

		fuse = new Fuse(RaidData, options); // "RaidData" is the item array
    });

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
process.stdout.write("listening for messages...\n");

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
}

function ProcessRaidsCommand(message) 
{
	var raidListMarkup = [];
	raidListMarkup.push("__**LOCAL RAID SCHEDULES (L5)**__\n");

	// Create sortedRaids array
	var sortedRaids = new Array();
	for (var key in ActiveRaids) 
	{
		var raid = ActiveRaids[key];
    	sortedRaids.push(raid);
	}

	// sort raids by date
	sortedRaids.sort(function(a,b)
	{
    	return a.HatchTime - b.HatchTime;
	});

	for (var i = 0; i < sortedRaids.length; i++) 
	{
		var raid = sortedRaids[i];
		raidListMarkup.push(raid.RaidLocation + " @ " + formatDate(raid.HatchTime) + "\n");
	}

	var raidListContent = raidListMarkup.join("");
    message.channel.send(raidListContent);
}

function ProcessDirectionsCommand(message) 
{
	if (message.content.startsWith("!directions")) 
	{
		var raidToGetDirectionsFor = message.content.replace("!directions", "").trim();
		var searchResults = fuse.search(raidToGetDirectionsFor);
		if (searchResults.length < 1) 
		{
			ReportError(message, "!directions", "");
			return;
		}

		var closestResult = searchResults[0];
		var directionsContent = closestResult.RaidLocation + " [Directions]\n" + closestResult.MapLink + "\n";
		message.channel.send(directionsContent);
	}
}

function ProcessAddCommand(message) 
{
	// command example !add "cleveland fountain" @ 4:15 pm
	if (message.content.startsWith("!add")) 
	{
		var input = message.content.replace("!add", "");

		if (input.split("@").length == 2) 
		{
			var raidLocationInput = input.split("@")[0].trim();
			var raidTimeInput = input.split("@")[1].trim();

			// default time today's month and year
			var raidTime = new Date();

			if ( !raidTimeInput.toLowerCase().includes("am") && !raidTimeInput.toLowerCase().includes("pm") ) 
			{
				ReportError(message, "!add", "Zzzrt! That is an invalid time format.");
				return;
			}

			var time = raidTimeInput.toLowerCase().replace("am", "").replace("pm", "");
			if (time.split(":").length == 2) 
			{
				if ( isNaN(time.split(":")[0]) || isNaN(time.split(":")[1]) ) 
				{
					ReportError(message, "!add", "Zzzrt! That is an invalid time format.");
					return;
				}

				var hour = parseInt(time.split(":")[0]);
				var minutes = parseInt(time.split(":")[1]);

				if ((hour < 1 || hour > 12) || (minutes < 0 || minutes > 60))
				{
	           		ReportError(message, "!add", "Zzzrt! That is an invalid time format.");
					return;
				}

				hour = hour % 12;
				hour += raidTimeInput.toLowerCase().includes("pm") ? 12 : 0;
				raidTime.setHours(hour);
				raidTime.setMinutes(minutes);
				raidTime.setSeconds(0);

				// Get closest result and add to raid list
				var searchResults = fuse.search(raidLocationInput);

				if (searchResults.length < 1) 
				{
					ReportError(message, "!add", "");
					return;
				}

				var closestResult = searchResults[0];
				var expiryTime = new Date(raidTime.getTime());
				expiryTime.setMinutes(expiryTime.getMinutes() + 45);

				var maxAllowablePredictionTime = new Date();
				maxAllowablePredictionTime.setMinutes(maxAllowablePredictionTime.getMinutes() + 60);
				if (raidTime > maxAllowablePredictionTime) 
				{
					ReportError(message, "!add", "My circuitzzz are tingling! That raid hatch time is too far in the future...");
					return;
				}

				var raid = { 
					City: closestResult.City,
					RaidLocation: closestResult.RaidLocation,
					FriendlyName: closestResult.FriendlyName, 
					HatchTime: raidTime,
					ExpiryTime: expiryTime,
					Lng: closestResult.Lng, 
					Lat: closestResult.Lat, 
					MapLink: closestResult.MapLink
				};

				ActiveRaids[raid.RaidLocation] = raid;
				ProcessRaidsCommand(message);

			} else {

				ReportError(message, "!add", "");
				return;
			}

		} else {
			// error message.
       		ReportError(message, "!add", "");
			return;
		}
  	}
}

function ProcessRemoveCommand(message) 
{

	if (message.content.startsWith("!remove")) 
	{

		var raidToRemove = message.content.replace("!remove", "").trim();

		// Get closest result and add to raid list
		var searchResults = fuse.search(raidToRemove);
		if (searchResults.length < 1) 
		{
			ReportError(message, "!remove", "");
			return;
		}

		var closestResult = searchResults[0];

		if (closestResult.RaidLocation in ActiveRaids) 
		{
			delete ActiveRaids[closestResult.RaidLocation];
			ProcessRaidsCommand(message);
		}

	} else {

   		ReportError(message, "!remove", "");
		return;
	}
}

function ProcessDiscordMessage(message) 
{
	// check that message has content
	if (message) 
	{
		var cmd = message.content.split(" ")[0].toLowerCase();
		
		switch(cmd) 
		{
		    case "!add":
           		var output = "Processing " + cmd + " command submitted by user " + message.author +  "\n";
        		process.stdout.write(output);
        		message.channel.send(output);
		    	ProcessAddCommand(message);
		        break;
		    case "!remove":
		        var output = "Processing " + cmd + " command submitted by user " + message.author +  "\n";
        		process.stdout.write(output);
        		message.channel.send(output);
        		ProcessRemoveCommand(message);
		        break;
		    case "!raids":
		    	ProcessRaidsCommand(message);
		    	break;
			case "!directions":
				var output = "Processing " + cmd + " command submitted by user " + message.author +  "\n";
        		process.stdout.write(output);
        		message.channel.send(output);
		    	ProcessDirectionsCommand(message);
		    	break;
	    	case "!help":
	    		// TODO: fill in command documentation
	    		break;
		    default:
		        return;
       	}
	}
}

function ReportError(message, cmd, error) 
{
	var output = "Zzz-zzt! Could not process " + cmd + " command submitted by " + message.author + "\n\nError: " + error + "\n";
	process.stdout.write(output);
	message.channel.send(output);
}

function formatDate(date) 
{
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+ minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

// Raid list clean up, recurr every 10 seconds
setInterval(RaidListRefresh, 10 * 1000);

client.on("message", async message => {

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
	}	
});