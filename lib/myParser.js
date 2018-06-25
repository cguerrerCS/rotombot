"use strict";

const { CommandProcessor } = require("botsbits");

const myCommands = [
    {
        name: "get my information",
        description: [
            "Display my information:",
            "  !my info",
        ],
        pattern: /^!my\s+info\s*$/i,
        handleCommand: () => {
            return { display: true };
        },
    },
    {
        name: "set preferred cities",
        description: [
            "preferred cities:",
            "  !my cities [are] <cities>",
        ],
        pattern: /^!my\s+cities\s+(?:are\s+)?([\w\s,]+)\s*$/i,
        handleCommand: (matches) => {
            return { update: { preferredCities: matches[1].split(",") } };
        },
    },
];

const myProcessor = new CommandProcessor(myCommands);

module.exports = {
    tryParse: function (command, gyms) {
        let cmdResult = myProcessor.processFirst(command);
        if (!cmdResult.found) {
            return undefined;
        }

        let want = cmdResult.result;
        if (want.update && want.update.preferredCities) {
            if (gyms) {
                want.update.preferredCities = gyms.getCityDisplayNames(want.update.preferredCities);
            }
            else {
                for (let i = 0; i < want.update.preferredCities.length; i++) {
                    want.update.preferredCities[i] = want.update.preferredCities[i].trim();
                }
            }
        }
        return want;
    },
};
