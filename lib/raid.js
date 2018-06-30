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

/*
 * Raid Formatting
 */

const formatParts = [
    { placeholder: "STATE", replacement: (r) => (r.state === Raid.State.egg ? "Upcoming" : "Current") },
    { placeholder: "TIER", replacement: (r) => `T${r.tier}` },
    { placeholder: "GYM_NAME", replacement: (r) => r.gym.officialName },
    { placeholder: "FRIENDLY_NAME", replacement: (r) => r.gym.friendlyName },
    { placeholder: "BOSS_NAME", replacement: (r) => (r.pokemon ? r.pokemon.name : "Undefined") },
    { placeholder: "SPAWN_TIME", replacement: (r) => Utils.formatTimeAmPm(r.spawnTime) },
    { placeholder: "HATCH_TIME", replacement: (r) => Utils.formatTimeAmPm(r.hatchTime) },
    { placeholder: "EXPIRY_TIME", replacement: (r) => Utils.formatTimeAmPm(r.expiryTime) },
    { placeholder: "NOW_TIME", replacement: () => Utils.formatTimeAmPm(new Date()) },
    { placeholder: "RAIDER_SUMMARY", replacement: (r) => Rsvp.classifyRaiders(r.raiders).summary },
    { placeholder: "MAP_LINK", replacement: (r) => r.gym.mapLink },
    { placeholder: "GUIDE_LINK", replacement: (r) => {
        return "http://www.pokebattler.com/raids" + (r.pokemon ? `/${r.pokemon.name.toUpperCase()}` : "");
    },
    },
];

const activeRaidFormatOptions = {
    format: "[TIER BOSS_NAME] GYM_NAME ends @ EXPIRY_TIME RAIDER_SUMMARY",
    parts: formatParts,
};

const upcomingRaidFormatOptions = {
    format: "[TIER] GYM_NAME @ HATCH_TIME RAIDER_SUMMARY",
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
        if (raid.state === Raid.State.egg) {
            return format.upcoming || format;
        }
        else if (raid.state === Raid.State.hatched) {
            return format.active || format;
        }
        else {
            throw new Error(`Internal error: unexpected raid state ${raid.state}`);
        }
    }
    return format;
}

Raid.raidToString = function (raid, format) {
    return Format.formatObject(raid, getFormatForRaidState(raid, format), getOptionsForRaidState(raid));
};

Raid.raidToDiscordMessage = function (raid) {
    let description = Raid.raidToString(raid);
    let message = {
        content: description,
        embed: {
            color: 3447003,
            title: Raid.raidToString(raid, { egg: "FRIENDLY_NAME hatches at HATCH_TIME", boss: "FRIENDLY_NAME ends at EXPIRY_TIME" }),
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

function getHeader(active, options) {
    let header = "Raids";

    options = options || {};

    let description = options.description;
    if (active) {
        header = options.upcomingHeader;
        header = header || (description ? `__**ACTIVE RAIDS ${description}**__` : "__**ACTIVE RAIDS**__");
    }
    else {
        header = options.activeHeader;
        header = header || (description ? `__**UPCOMING RAIDS ${description}**__` : "__**UPCOMING RAIDS**__");
    }
    return header;
}

Raid.getFormattedRaidOutput = function (raids, options) {
    let result = Raid.getFormattedRaidLists(raids, options);
    let output = [];

    if (result.activeRaidOutput.length > 0) {
        output.push(getHeader(true, options));
        result.activeRaidOutput.forEach((r) => output.push(r));
    }

    if (result.upcomingRaidOutput.length > 0) {
        if (output.length > 0) {
            output.push("");
        }

        output.push(getHeader(false, options));
        result.upcomingRaidOutput.forEach((r) => output.push(r));
    }

    return output;
};

Raid.getFormattedRaidOutputAsString = function (raids, options) {
    options = options || {};

    let output = Raid.getFormattedRaidOutput(raids, options);
    if (output.length < 1) {
        if (options.noRaidsMessage) {
            return options.noRaidsMessage;
        }
        else if (options.description) {
            return `No raids to report (${options.description}).`;
        }
        return "No raids to report.";
    }

    return output.join("\n") + "\n";
};

module.exports = Raid;
