"use strict";

const RaidManager = require("./raidManager");

var Raid = function () {

};

Raid.toDiscordMessage = function (raid) {
    let description = RaidManager.getFormattedRaidDescription(raid).description;
    let message = {
        content: description,
        embed: {
            color: 3447003,
            title: RaidManager.getFormattedRaidDescription(raid, "FRIENDLY_NAME hatches at HATCH_TIME", "FRIENDLY_NAME ends at EXPIRY_TIME").description,
            description: raid.gym.toString("CITY [(Directions)](MAP_LINK)"),
            thumbnail: {
                url: `http://www.didjaredo.com/pogo/images/48x48/${raid.pokemon ? "regice" : "t5"}.png`,
            },
            fields: [],
        },
    };

    /*
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
    */
    return message;
};

module.exports = Raid;
