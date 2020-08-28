"use strict";

const { FlexTime } = require("botsbits");

const Format = require("./format");
const Utils = require("./utils");
const Rsvp = require("./rsvp");

function Raid(init) {
    validateInitializer(init);
    this.tier = Number(init.tier);
    this.boss = init.boss || init.pokemon;
    this.gym = init.gym;
    this.state = init.state;
    this.spawnTime = init.spawnTime;
    this.hatchTime = init.hatchTime;
    this.expiryTime = init.expiryTime;
    this.raiders = {};
}

Raid.State = Object.freeze({ "egg": 1, "hatched": 2 });

Raid.minTier = 1;
Raid.maxTier = 5;

Raid.maxEggHatchTime = 60;
Raid.maxRaidActiveTime = 45;

function validateInitializer(init) {
    let ok = (typeof init === "object");
    ok = ok && Number.isFinite(init.tier) && (init.tier >= Raid.minTier) && (init.tier <= Raid.maxTier);
    ok = ok && (typeof init.gym === "object");
    ok = ok && (init.state === Raid.State.egg) || (init.state === Raid.state.hatched);
    ok = ok && (init.spawnTime instanceof Date) && (init.hatchTime instanceof Date) && (init.expiryTime instanceof Date);
    ok = ok && (init.expiryTime.getTime() > init.hatchTime.getTime()) && (init.hatchTime.getTime() > init.startTime.getTime());
    if (!ok) {
        throw new Error(`Invalid raid initializer: ${JSON.stringify(init)}`);
    }
}

Raid._validateTier = function (wantTier) {
    // hack for now
    if (typeof wantTier === "string") {
        const lower = wantTier.toLowerCase();
        if ((lower === "mega") || (lower === "m")) {
            return 4;
        }
    }

    if (wantTier !== undefined) {
        let tier = Number(wantTier);

        if (Number.isNaN(tier)) {
            if ((typeof wantTier !== "string") || (!wantTier.startsWith("Tier"))) {
                throw new Error(`Tier value ${wantTier} must be a number.`);
            }
            tier = Number(wantTier.replace("Tier", "").trim());
        }

        if ((tier < Raid.minTier) || (tier > Raid.maxTier)) {
            throw new Error(`Tier value ${wantTier} must be in the range ${Raid.minTier}-${Raid.maxTier}.`);
        }

        if ((tier === 2) || (tier === 4)) {
            throw new Error(`Tier ${tier} is no longer valid for raids.`);
        }

        return tier;
    }
    return Raid.maxTier;
};

Raid.validateHatchTime = function (wantHatchTime) {
    let time = new FlexTime(wantHatchTime);
    const delta = new FlexTime().getDeltaInMinutes(time);

    if (delta > Raid.maxEggHatchTime) {
        throw new Error(`Requested hatch time ${time.toString()} is too far in the future (max ${Raid.maxEggHatchTime} minutes).`);
    }
    else if (delta < -1) {
        // a little fudge factor for people adding a raid right at hatch
        throw new Error(`Requested hatch time ${time.toString()} is in the past.`);
    }
    return time;
};

Raid.validateEggTimer = function (wantTimer) {
    const timer = Number(wantTimer);
    if (Number.isNaN(timer)) {
        throw new Error(`Egg timer value ${wantTimer} is not a number.`);
    }
    if ((timer < 1) || (timer > Raid.maxEggHatchTime)) {
        throw new Error(`Egg timer ${wantTimer} is out of range (1..${Raid.maxEggHatchTime}).`);
    }
    return timer;
};

Raid.validateRaidTimer = function (wantTimer) {
    const timer = Number(wantTimer);
    if (Number.isNaN(timer)) {
        throw new Error(`Raid timer value ${wantTimer} is not a number.`);
    }
    if ((timer < 1) || (timer > Raid.maxRaidActiveTime)) {
        throw new Error(`Raid timer ${wantTimer} is out of range (1..${Raid.maxRaidActiveTime}).`);
    }
    return timer;
};

Raid.prototype.toString = function (format) { return Raid.raidToString(this, format); };
Raid.prototype.toDiscordMessage = function () { return Raid.raidToDiscordMessage(this); };

Raid.prototype.addOrUpdateRaider = function (raiderInfo) {
    raiderInfo = Rsvp.createOrUpdateRsvp(this, this.raiders[raiderInfo.raiderName], raiderInfo);
    this.raiders[raiderInfo.raiderName] = raiderInfo;
    return raiderInfo;
};

Raid.prototype.tryGetRaider = function (raiderName) {
    return this.raiders[raiderName];
};

Raid.prototype.removeRaider = function (raiderName) {
    if (!this.raiders[raiderName]) {
        throw new Error(`Raider ${raiderName} has not rsvp'ed for ${this.gym.friendlyName}.`);
    }
    delete this.raiders[raiderName];
};

Raid.prototype.forEachRaider = function (func) {
    Utils.forOwn(this.raiders, (r, n) => func(r, n));
};

Raid.forEachRaiderInRaid = function (raid, func) {
    Utils.forOwn(raid.raiders, (r, n) => func(r, n));
};

/*
 * Raid Formatting
 */

const formatParts = [
    { placeholder: "STATE", replacement: (r) => (r.state === Raid.State.egg ? "Upcoming" : "Current") },
    { placeholder: "TIER", replacement: (r) => {
        if (r.tier === 4) {
            return "M";
        }
        return `T${r.tier}`;
    } },
    { placeholder: "GYM_NAME", replacement: (r) => r.gym.officialName },
    { placeholder: "NAME_LINK_EX", replacement: (r, o) => {
        let marker = (r.gym.isExEligible ? " [EX]" : "");
        if (o && o.destination === "embed") {
            return `[${r.gym.officialName}](${r.gym.mapLink})${marker}`;
        }
        return `${r.gym.officialName}${marker}`;
    } },
    { placeholder: "NAME_LINK", replacement: (r, o) => {
        return (o && o.destination === "embed") ? `[${r.gym.officialName}](${r.gym.mapLink})` : r.gym.officialName;
    } },
    { placeholder: "FRIENDLY_NAME", replacement: (r) => r.gym.friendlyName },
    { placeholder: "EX_MARKER", replacement: (r) => (r.gym.isExEligible ? "[EX] " : "") },
    { placeholder: "BOSS_NAME", replacement: (r) => (r.pokemon ? r.pokemon.name : "Undefined") },
    { placeholder: "SPAWN_TIME", replacement: (r) => Utils.formatTimeAmPm(r.spawnTime) },
    { placeholder: "HATCH_TIME", replacement: (r) => Utils.formatTimeAmPm(r.hatchTime) },
    { placeholder: "EXPIRY_TIME", replacement: (r) => Utils.formatTimeAmPm(r.expiryTime) },
    { placeholder: "NOW_TIME", replacement: () => Utils.formatTimeAmPm(new Date()) },
    { placeholder: "RAIDER_SUMMARY", replacement: (r) => Rsvp.classifyRaiders(r.raiders).summary },
    { placeholder: "CITY", replacement: (r) => r.gym.city },
    { placeholder: "MAP_LINK", replacement: (r) => r.gym.mapLink },
    { placeholder: "GUIDE_LINK", replacement: (r) => {
        return r.pokemon ? r.pokemon.guideLink : "http://www.pokebattler.com/raids";
    },
    },
];

const activeRaidFormatOptions = {
    formatsByDestination: {
        text: "[TIER BOSS_NAME] NAME_LINK_EX ends @ EXPIRY_TIME",
        markdown: "[TIER BOSS_NAME] NAME_LINK_EX *ends @ EXPIRY_TIME*",
        embed: "[[TIER BOSS_NAME](GUIDE_LINK)] NAME_LINK_EX *ends @ EXPIRY_TIME*",
    },
    parts: formatParts,
};

const upcomingRaidFormatOptions = {
    formatsByDestination: {
        text: "[TIER] NAME_LINK_EX @ HATCH_TIME RAIDER_SUMMARY",
        markdown: "[TIER] NAME_LINK_EX *@ HATCH_TIME* RAIDER_SUMMARY",
        embed: "[TIER] NAME_LINK_EX *@ HATCH_TIME* RAIDER_SUMMARY",
    },
    parts: formatParts,
};

function getOptionsForRaidState(raid) {
    if (raid.state === Raid.State.egg) {
        return upcomingRaidFormatOptions;
    }
    else if (raid.state === Raid.State.hatched) {
        return activeRaidFormatOptions;
    }
    else {
        throw new Error(`Internal error: unexpected raid state ${raid.state}`);
    }
}

function getFormatForRaidState(raid, format) {
    if (typeof format === "object") {
        let result = { destination: format.destination };

        if (format.format) {
            result.format = format.format;
        }
        else if (raid.state === Raid.State.egg) {
            result.format = format.upcoming;
        }
        else if (raid.state === Raid.State.hatched) {
            result.format = format.active;
        }
        else {
            throw new Error(`Internal error: unexpected raid state ${raid.state}`);
        }

        if (result.destination) {
            return result;
        }
        else if (!result.format) {
            throw new Error("Raid format must specify either destination or explicit format.");
        }

        return result.format;
    }
    return format;
}

Raid.raidToString = function (raid, format) {
    return Format.formatObject(raid, getFormatForRaidState(raid, format), getOptionsForRaidState(raid));
};

const raidCardTitleFormats = {
    upcoming: "GYM_NAME",
    active: "GYM_NAME",
};

const raidCardDescriptionFormats = {
    upcoming: "TIER _hatches at HATCH_TIME_\nCITY [(Directions)](MAP_LINK)",
    active: "[TIER BOSS_NAME](GUIDE_LINK) _ends at EXPIRY_TIME_\nCITY [(Directions)](MAP_LINK)",
};

Raid.getRaidThumbnail = function (raid) {
    if (raid.boss) {
        return raid.boss.image;
    }
    if (raid.pokemon) {
        return raid.pokemon.image;
    }
    return `http://www.didjaredo.com/pogo/images/32x32/t${raid.tier}.png`;
};

Raid.raidToDiscordMessage = function (raid) {
    let content = Raid.raidToString(raid);
    let title = Raid.raidToString(raid, raidCardTitleFormats);
    let description = Raid.raidToString(raid, raidCardDescriptionFormats);
    let thumbnail = Raid.getRaidThumbnail(raid);

    let message = {
        content: content,
        embed: {
            color: 3447003,
            title: title,
            description: description,
            thumbnail: {
                url: thumbnail,
                width: 32,
                height: 32,
            },
            fields: [
            ],
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

Raid.categorizeRaids = function (raids) {
    let result = { active: [], upcoming: [] };
    raids.forEach((raid) => {
        if (raid.state === Raid.State.egg) {
            result.upcoming.push(raid);
        }
        else {
            result.active.push(raid);
        }
    });
    return result;
};

Raid.getFormattedRaidLists = function (raids, options) {
    options = options || {};

    if (Array.isArray(raids)) {
        raids = Raid.categorizeRaids(raids);
    }

    let result = {
        activeRaidOutput: [],
        upcomingRaidOutput: [],
    };

    raids.active.forEach((raid) => result.activeRaidOutput.push(Raid.raidToString(raid, options.raidFormat)));
    raids.upcoming.forEach((raid) => result.upcomingRaidOutput.push(Raid.raidToString(raid, options.raidFormat)));

    return result;
};

function getHeader(active, headings, options) {
    let header = "Raids";

    options = options || {};
    headings = headings || {};

    let destination = options.destination || "markdown";

    let description = headings.description;
    if (active) {
        header = headings.upcomingHeader;
        if (!header) {
            header = (description ? `ACTIVE RAIDS ${description}` : "ACTIVE RAIDS");
            if (destination !== "text") {
                header = `__**${header}**__`;
            }
        }
    }
    else {
        header = headings.activeHeader;
        if (!header) {
            header = (description ? `UPCOMING RAIDS ${description}` : "UPCOMING RAIDS");
            if (destination !== "text") {
                header = `__**${header}**__`;
            }
        }
    }
    return header;
}

Raid.getFormattedRaidListOutput = function (raids, headings, options) {
    let result = Raid.getFormattedRaidLists(raids, options);
    let output = [];

    if (result.activeRaidOutput.length > 0) {
        output.push(getHeader(true, headings, options));
        result.activeRaidOutput.forEach((r) => output.push(r));
    }

    if (result.upcomingRaidOutput.length > 0) {
        if (output.length > 0) {
            output.push("");
        }

        output.push(getHeader(false, headings, options));
        result.upcomingRaidOutput.forEach((r) => output.push(r));
    }

    return output;
};

Raid.getFormattedRaidListOutputAsString = function (raids, headings, options) {
    headings = headings || {};
    options = options || {};

    let output = Raid.getFormattedRaidListOutput(raids, headings, options);
    if (output.length < 1) {
        if (headings.noRaidsMessage) {
            return headings.noRaidsMessage;
        }
        else if (headings.description) {
            return `__**RAIDS (${headings.description})**__\nNo raids reported.`;
        }
        return "__**RAIDS**__\nNo raids reported.";
    }

    return output.join("\n") + "\n";
};

Raid.raidListToDiscordMessage = function (raids, headings, options) {
    let message = {
        content: Raid.getFormattedRaidListOutputAsString(raids),
        embed: {
            color: 3447003,
            fields: [],
            footer: {
                text: "Select any gym for directions or any boss for a raid guide.",
            },
        },
    };

    options = options || { destination: "embed" };
    headings = headings || {};

    if (headings.thumbnail) {
        message.thumbnail = { url: headings.thumbnail };
    }

    let raidLists = Raid.getFormattedRaidLists(raids, { raidFormat: options });

    if (raidLists.activeRaidOutput.length > 0) {
        message.embed.title = getHeader(true, headings, options);
        message.embed.description = raidLists.activeRaidOutput.join("\n");
    }

    if (raidLists.upcomingRaidOutput.length > 0) {
        let header = getHeader(false, headings, options);
        let body = raidLists.upcomingRaidOutput.join("\n");
        if (message.embed.title === undefined) {
            message.embed.title = header;
            message.embed.description = body;
        }
        else {
            message.embed.description += "\n\u200b";
            message.embed.fields.push({ name: header, value: body });
        }
    }

    if (headings.extraText) {
        message.embed.fields.push({ name: "\u200b", value: headings.extraText });
    }

    if (!message.embed.title) {
        if (headings.noRaidsMessage) {
            message.embed.title = headings.noRaidsMessage;
        }
        else if (headings.description) {
            message.embed.title = `__**RAIDS (${headings.description})**__`;
            message.embed.description = "No raids reported.";
        }
        else {
            message.embed.title = "__**RAIDS**__";
            message.embed.description = "No raids reported.";
        }
        message.embed.footer = {};
    }

    return message;
};

Raid.raidListToRaiderSummaryCard = function (raids) {
    let message = {
        content: "Raider summary not available as text",
        embed: {
            title: "__**RSVPs**__",
            color: 3447003,
            fields: [],
            footer: {
                text: "Send \"!help iam\" to Rotom to learn how to RSVP",
            },
        },
    };

    raids.forEach((raid) => {
        let raiderSummary = Rsvp.raidersObjectToString(raid.raiders);
        if (raiderSummary) {
            message.embed.fields.push({
                name: Raid.raidToString(raid, { destination: "markdown", format: "GYM_NAME" }),
                value: raiderSummary,
            });
        }
    });

    return (message.embed.fields.length > 0 ? message : undefined);
};

module.exports = Raid;
