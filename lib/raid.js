"use strict";

const RaidManager = require("./raidManager");

var Raid = function () {

};

Raid.toDiscordMessage = function (raid) {
    let description = RaidManager.getFormattedRaidDescription(raid).description;
    description = description.replace(/\[(T[1-5])\]/, ":$1:");
    let message = {
        content: description,
        embed: {
            color: 3447003,
            title: description,
            description: `[Directions](${raid.gym.mapLink})`,
            thumbnail: {
                url: "http://www.didjaredo.com/pogo/images/48x48/kyogre.png",
            },
            fields: [],
        },
    };

    let raidersText = "";
    for (let name in raid.raiders) {
        if (raid.raiders.hasOwnProperty(name)) {
            raidersText += `${raid.raiders[name].toString()}\n`;
        }
    }
    if (raidersText.length > 0) {
        message.embed.fields.push({
            name: "Raiders",
            value: raidersText,
        });
    }
    return message;
};

module.exports = Raid;
