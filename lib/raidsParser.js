"use strict";

const { CommandProcessor } = require("botsbits");

const raidCommands = [
    {
        name: "all raids",
        description: [
            "All raids:",
            "  !raids all [in <city>]",
            "  !raids all in rose hill",
        ],
        pattern: /^!raids\s+all\s*(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: 1, maxTier: 5, city: matches[1] };
        },
    },
    {
        name: "raids by minimum tier",
        description: [
            "Minimum tier:",
            "  !raids <minTier>+ [in <city>]",
            "  !raids 3+",
            "  !raids 3+ in bellevue",
        ],
        pattern: /^!raids\s+(?:T)?(\d)[+]\s*(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: matches[1], maxTier: 5, city: matches[2] };
        },
    },
    {
        name: "raids by exact tier",
        description: [
            "Exact tier:",
            "  !raids <tier> [in <city>]",
            "  !raids 4",
            "  !raids 4 in overlake",
        ],
        pattern: /^!raids\s+(?:T)?(\d)(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: matches[1], maxTier: matches[1], city: matches[2] };
        },
    },
    {
        name: "raids by range of tiers",
        description: [
            "Exact tier:",
            "  !raids <tier> [in <city>]",
            "  !raids 4",
            "  !raids 4 in overlake",
        ],
        pattern: /^!raids\s+(?:T)?(\d)\s*-\s*(?:T)?(\d)\s*(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: matches[1], maxTier: matches[2], city: matches[2] };
        },
    },
    {
        name: "default list of raids",
        description: [
            "Default (T4 & 5):",
            "  !raids [in <city>]",
            "  !raids",
            "  !raids in redmond",
        ],
        pattern: /^!raids\s*(?:\s+in\s+(\w(?:\s|\w)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: 4, maxTier: 5, city: matches[1] };
        },
    },
];

const raidProcessor = new CommandProcessor(raidCommands);

module.exports = {
    tryParse: function (command) {
        let cmdResult = raidProcessor.processFirst(command);
        if (!cmdResult.found) {
            return undefined;
        }

        let want = cmdResult.result;
        want.cityRegex = (want.city ? new RegExp(`.*${want.city}.*`, "i") : /.*/);
        want.filter = function (r) {
            return (r.tier >= want.minTier) && (r.tier <= want.maxTier) && want.cityRegex.test(r.gym.city);
        };
        want.filterDescription = (((want.minTier === want.maxTier) ? `T${want.minTier}` : `T${want.minTier}-T${want.maxTier}`) + (want.city ? ` in ${want.city}` : ""));
        return want;
    },
};
