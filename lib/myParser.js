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
            return { preferredCities: matches[1] };
        },
    },
];

const myProcessor = new CommandProcessor(myCommands);

module.exports = {
    tryParse: function (command) {
        let cmdResult = myProcessor.processFirst(command);
        if (!cmdResult.found) {
            return undefined;
        }

        let want = cmdResult.result;
        if (want.preferredCities) {
            want.preferredCities = want.preferredCities.split(",");
            for (let i = 0; i < want.preferredCities.length; i++) {
                want.preferredCities[i] = want.preferredCities[i].trim();
            }
        }
        return want;
    },
};
