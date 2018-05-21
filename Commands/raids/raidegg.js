const commando = require('discord.js-commando');
const cmdParser = require('discord-command-parser');

//!add command
class raidegg extends commando.Command{
    constructor(client){
        super(client,{
            name: 'raidegg',
            group: 'raids',
            memberName: 'raidegg',
            description: "add raid egg to incoming raids list, '@' denotes absolute time 'in' is relative time",
            examples: [
              '!raidegg <tier [1-5]> <location> @ <hh:mm am/pm>',
              '!raidegg 5 Luke McRedmond @ 12:45 pm',
              '!raidegg <tier [1-5]> <location> in <timer [1-60]>',
              '!raidegg 5 Painted Parking in 20'
            ]
        })
    }

    async run(message) {

        var client = message.client;
        var output = "Processing !raidegg command submitted by user " + message.author +  "\n";
        process.stdout.write(output);
        message.channel.send(output);

        if (message.channel.type.toString() == "dm")
        {
            client.ReportError(message, "!raidegg", "cannot add raid eggs via DMs.");
            return;
        }

        // parse arguments
        let parsed = cmdParser.parse(message, '!');
        if (!parsed.success) return;

        // clean up additional whitespace between arguments
        var input = parsed.arguments.join(' ');
        console.log("input: " + input);

        // get matches for in syntax
        var inKeywordPattern = '([1-5])[ ]([^(\\s)].+)[ ][iI][nN][ ]([6][0]|[1-5][0-9]|[1-9])';
        var inKeywordRegex = RegExp(inKeywordPattern,'g');
        var inKeywordArray;
        while ((inKeywordArray = inKeywordRegex.exec(input)) !== null) {

          //console.log(`Found match with 'in' keyword ${inKeywordArray[0]}. Next starts at ${inKeywordRegex.lastIndex}.`);
          //console.log(`tier: ${inKeywordArray[1]}`);
          //console.log(`location: ${inKeywordArray[2]}`);
          //console.log(`countdown: ${inKeywordArray[3]}`);

          var tier = inKeywordArray[1];
          var location = inKeywordArray[2];
          var countdown = inKeywordArray[3];

          // Get closest result and add to raid list
          var searchResults = client.RaidsFuzzySearch.search(location);
          if (searchResults.length < 1)
          {
            client.ReportError(message, "!raidegg", "no gym found matching search results");
            return;
          }
          var closestResult = searchResults[0];

          try {
            client.RaidManager.addEggCountdown(tier, closestResult.RaidLocation, countdown );
          } catch(err) {
            client.ReportError(message, "!raidegg", err);
            return;
          }

          // client.RaidManager.addEggCountdown(tier, closestResult.RaidLocation, countdown );
          message.channel.send(client.RaidManager.listFormatted());
          return;
        }

        // get matches for @ syntax
        var atKeywordPattern = '([1-5])[ ]([^(\\s)].+)[ ]@[ ]((1[0-2]|0?[1-9]):([0-5][0-9])[ ]{0,1}([AaPp][Mm]))';
        var atKeywordRegex = RegExp(atKeywordPattern,'g');
        var atKeywordArray;
        while ((atKeywordArray = atKeywordRegex.exec(input)) !== null) {

          //console.log(`Found ${atKeywordArray[0]}. Next starts at ${atKeywordRegex.lastIndex}.`);

          var tier = atKeywordArray[1];
          var location = atKeywordArray[2];
          var time = atKeywordArray[3];
          var hour = parseInt(atKeywordArray[4]);
          var minute = parseInt(atKeywordArray[5]);
          var ampm = atKeywordArray[6];

          //console.log(`tier: ${atKeywordArray[1]}`);
          //console.log(`location: ${atKeywordArray[2]}`);
          //console.log(`time: ${atKeywordArray[3]}`);
          //console.log(`hour: ${atKeywordArray[4]}`);
          //console.log(`minute: ${atKeywordArray[5]}`);
          //console.log(`am: ${atKeywordArray[6]}`);

          var eggHatchTime = new Date();
          hour = hour % 12;
          hour += ampm.toLowerCase().includes("pm") ? 12 : 0;
          eggHatchTime.setHours(hour);
          eggHatchTime.setMinutes(minute);
          eggHatchTime.setSeconds(0);

          var maxAllowablePredictionTime = new Date();
          var minAllowablePredictionTime = new Date();
          maxAllowablePredictionTime.setMinutes(maxAllowablePredictionTime.getMinutes() + 60);
          minAllowablePredictionTime.setMinutes(minAllowablePredictionTime.getMinutes());
          if (eggHatchTime > maxAllowablePredictionTime)
          {
            client.ReportError(message, "!raidegg", "My circuitzzz are tingling! That raid egg hatch time is too far in the future...");
            return;
          }

          if (eggHatchTime < minAllowablePredictionTime)
          {
            client.ReportError(message, "!raidegg", "My circuitzzz are tingling! That raid egg already hatched. Report the active raid.");
            return;
          }

          // Get closest result and add to raid list
          var searchResults = client.RaidsFuzzySearch.search(location);
          if (searchResults.length < 1)
          {
            client.ReportError(message, "!raidegg", "no gym found matching search results");
            return;
          }
          var closestResult = searchResults[0];

          try {
            client.RaidManager.addEggAbsolute(tier, closestResult.RaidLocation, eggHatchTime );
          } catch(err) {
            client.ReportError(message, "!raidegg", err);
            return;
          }

          // client.RaidManager.addEggAbsolute(tier, closestResult.RaidLocation, eggHatchTime );
          message.channel.send(client.RaidManager.listFormatted());
          return;
        }

        client.ReportError(message, "!raidegg", "invalid command argument, try !help command.");
        return;
    }
}

module.exports = raidegg;
