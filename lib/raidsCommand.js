"use strict";

const { CommandProcessor } = require("botsbits");
const Utils = require("./utils");
const Raid = require("./raid");

const raidCommands = [
    {
        name: "all raids",
        description: [
            "All raids:",
            "  !raids all [in <cities>]",
            "  !raids all in rose hill",
        ],
        pattern: /^!raids\s+all\s*(?:\s+in\s+(\w(?:\s|\w|,)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: 1, maxTier: 5, place: matches[1], all: true };
        },
    },
    {
        name: "raids by minimum tier",
        description: [
            "Minimum tier:",
            "  !raids <minTier>+ [in <cities>]",
            "  !raids 3+",
            "  !raids 3+ in bellevue",
        ],
        pattern: /^!raids\s+(?:T)?(\d)[+]\s*(?:\s+in\s+(\w(?:\s|\w|,)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: matches[1], maxTier: 5, place: matches[2] };
        },
    },
    {
        name: "raids by exact tier",
        description: [
            "Exact tier:",
            "  !raids <tier> [in <cities>]",
            "  !raids 4",
            "  !raids 4 in overlake",
        ],
        pattern: /^!raids\s+(?:T)?(\d)(?:\s+in\s+(\w(?:\s|\w|,)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: matches[1], maxTier: matches[1], place: matches[2] };
        },
    },
    {
        name: "raids by range of tiers",
        description: [
            "Range of tiers:",
            "  !raids <tier>-<tier> [in <cities>]",
            "  !raids 4-5",
            "  !raids 3-5 in overlake",
        ],
        pattern: /^!raids\s+(?:T)?(\d)\s*-\s*(?:T)?(\d)\s*(?:\s+in\s+(\w(?:\s|\w|,)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: matches[1], maxTier: matches[2], place: matches[3] };
        },
    },
    {
        name: "default list of raids",
        description: [
            "Default (T4 & 5):",
            "  !raids [in <cities>]",
            "  !raids",
            "  !raids in redmond",
        ],
        pattern: /^!raids\s*(?:\s+in\s+(\w(?:\s|\w|,)*))?\s*$/i,
        handleCommand: (matches) => {
            return { minTier: 4, maxTier: 5, place: matches[1] };
        },
    },
];

const raidProcessor = new CommandProcessor(raidCommands);

var RaidsCommand = function (command, raidManager, options) {
    this.raidManager = raidManager;
    this.allowEmbeds = (options && options.blockEmbeds) ? false : true;

    this.want = tryParse(command, raidManager, this.allowEmbeds);

    if (!this.want) {
        throw new Error(`Unrecognized raids command "${command}"`);
    }
};

RaidsCommand.prototype.getMessages = function (lookupOptions) {
    return getMessagesForCommand(this.want, this.raidManager, lookupOptions);
};

function tryParse(command, rm, allowEmbeds) {
    let showListCard = allowEmbeds;

    Utils.extract(command, "+nocard", (c) => {
        showListCard = false;
        command = c;
    });

    Utils.extract(command, "+listcard", (c) => {
        showListCard = allowEmbeds;
        command = c;
    });

    let showRaidCards = false;
    Utils.extract(command, "+raidcards", (c) => {
        showRaidCards = allowEmbeds;
        command = c;
    });

    let cmdResult = raidProcessor.processFirst(command);
    if (!cmdResult.found) {
        return undefined;
    }

    let want = cmdResult.result;

    if (want.place && want.place.trim().match(/^all$/i)) {
        want.allZones = true;
        want.place = "ALL ZONES";
    }

    want.haveCities = false;
    want.haveZones = false;

    if ((!want.allZones) && want.place && want.place.length > 0) {
        want.cities = {};
        want.zones = {};

        want.place.split(",").forEach((placeName) => {
            let city = rm.gyms.tryGetCity(placeName);
            let zone = (city === undefined) ? rm.gyms.tryGetZone(placeName) : undefined;

            if (city) {
                want.cities[city.normalized.name] = city;
                want.haveCities = true;
            }
            else if (zone) {
                want.zones[zone.normalized.name] = zone;
                want.haveZones = true;
            }
            else {
                throw new Error(`Unrecognized city or zone name ${placeName}.`);
            }
        });
    }

    want.filter = function (r) {
        let match = (r.tier >= want.minTier) && (r.tier <= want.maxTier);
        if (match) {
            if (want.haveCities) {
                match = match && want.cities.hasOwnProperty(r.gym.normalized.city);
            }

            if (want.haveZones) {
                let found = false;
                r.gym.normalized.zones.forEach((z) => {
                    found = found || want.zones.hasOwnProperty(z);
                });
                match = match && found;
            }
        }
        return match;
    };

    want.filterDescription = (((want.minTier === want.maxTier) ? `T${want.minTier}` : `T${want.minTier}-T${want.maxTier}`) + (want.place ? ` IN ${want.place.toUpperCase()}` : ""));
    want.showListCard = showListCard;
    want.showRaidCards = showRaidCards;
    return want;
}

function getMessagesForCommand(want, rm, lookupOptions) {
    let raids = rm.list(want.filter);

    if ((!want.haveCities) && (!want.haveZones) && (!want.allZones)) {
        raids = rm.chooseBestRaidsForLookupOptions(raids, lookupOptions);
    }

    let messages = [];

    if (want.showListCard) {
        let msg = Raid.raidListToDiscordMessage(raids, { description: want.filterDescription });
        if (msg.embed && Utils.validateDiscordEmbed(msg.embed)) {
            messages.push(msg);
        }
    }

    if ((messages.length === 0) && want.showRaidCards && raids && (raids.length > 0)) {
        if (raids && (raids.length > 0)) {
            raids.forEach((raid) => {
                let rm = Raid.raidToDiscordMessage(raid);
                messages.push(rm);
            });
        }
    }

    if (messages.length === 0) {
        let rl = Raid.getFormattedRaidListOutputAsString(raids, { description: want.filterDescription });
        messages.push({ content: rl });
    }

    return messages;
}

module.exports = RaidsCommand;
