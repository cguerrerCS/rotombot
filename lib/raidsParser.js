"use strict";

const { CommandProcessor } = require("botsbits");
const Utils = require("./utils");
const Raid = require("./raid");

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
            return { minTier: 1, maxTier: 5, city: matches[1], all: true };
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

var RaidsParser = function (command) {
    this.want = RaidsParser.tryParse(command);
    if (!this.want) {
        throw new Error(`Unrecognized raids command "${command}"`);
    }
};

RaidsParser.prototype.getMessages = function (rm) {
    return RaidsParser.getMessages(this.want, rm);
};

RaidsParser.tryParse = function (command) {
    let showListCard = true;

    Utils.extract(command, "+nocard", (c) => {
        showListCard = false;
        command = c;
    });

    Utils.extract(command, "+listcard", (c) => {
        showListCard = true;
        command = c;
    });

    let showRaidCards = false;
    Utils.extract(command, "+raidcards", (c) => {
        showRaidCards = true;
        command = c;
    });

    let cmdResult = raidProcessor.processFirst(command);
    if (!cmdResult.found) {
        return undefined;
    }

    let want = cmdResult.result;

    want.all = want.city && want.city.trim().match(/^all$/i);

    if ((!want.all) && want.city && want.city.length > 0) {
        want.haveCity = (want.city && (want.city.length > 0));
        want.cityRegex = (want.city ? new RegExp(`.*${want.city}.*`, "i") : /.*/);
    }
    else {
        want.haveCity = false;
        want.cityRegex = /.*/;
    }

    want.filter = function (r) {
        return (r.tier >= want.minTier) && (r.tier <= want.maxTier) && want.cityRegex.test(r.gym.city);
    };
    want.filterDescription = (((want.minTier === want.maxTier) ? `T${want.minTier}` : `T${want.minTier}-T${want.maxTier}`) + (want.city ? ` IN ${want.city.toUpperCase()}` : ""));
    want.showListCard = showListCard;
    want.showRaidCards = showRaidCards;
    return want;
};

RaidsParser.getMessagesForCommand = function (want, rm, lookupOptions) {
    let raids = rm.list(want.filter);

    if ((!want.haveCity) && (!want.all)) {
        raids = rm.chooseBestRaidsForLookupOptions(raids, lookupOptions);
    }

    let messages = [];

    if (want.showListCard) {
        messages.push(Raid.raidListToDiscordMessage(raids, { description: want.filterDescription }));
    }
    else if (want.showRaidCards && raids && (raids.length > 0)) {
        if (raids && (raids.length > 0)) {
            raids.forEach((raid) => {
                let rm = Raid.raidToDiscordMessage(raid);
                messages.push(rm);
            });
        }
    }
    else {
        let rl = Raid.getFormattedRaidListOutputAsString(raids, { description: want.filterDescription });
        messages.push({ content: rl });
    }

    return messages;
};

module.exports = RaidsParser;
