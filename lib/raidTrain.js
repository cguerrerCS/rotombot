"use strict";

const Utils = require("./utils");
const Format = require("./format");
const Raid = require("./raid");

let RaidTrain = function (raidManager) {
    this.rm = raidManager;
    this.stops = [];
};

RaidTrain.prototype.addStop = function (gymName, position) {
    let raid = this.rm.tryGetRaid(gymName);
    if (!raid) {
        throw new Error(`No raid at ${gymName}.`);
    }

    if (this.stops.findIndex((existing) => existing.gym === raid.gym) >= 0) {
        throw new Error(`Train is already scheduled to stop at ${raid.gym.officialName}`);
    }

    let index = this.stops.length;
    if (position) {
        let haveBefore = (position.before ? true : false);
        let haveAfter = (position.after ? true : false);
        if (haveBefore === haveAfter) {
            throw new Error("Position must specify exactly one of before or after.");
        }

        let otherName = position.before || position.after;
        let otherRaid = this.rm.tryGetRaid(otherName);
        if (!otherRaid) {
            throw new Error(`No raid at ${otherName}`);
        }

        let otherIndex = this.stops.findIndex((existing) => existing.gym.key === otherRaid.gym.key);
        if (otherIndex < 0) {
            throw new Error(`Raid at ${otherRaid.gym.officialName} is not on the train itinerary.`);
        }
        index = haveBefore ? otherIndex : otherIndex + 1;
    }

    let stop = { scheduledStart: undefined, estimatedStart: undefined, gym: raid.gym, raid: raid };
    if (this.stops.length === index) {
        this.stops.push(stop);
    }
    else {
        this.stops.splice(index, 0, stop);
    }

    this._estimateStartTimes();
    return raid;
};

RaidTrain.prototype.removeStop = function (gymName) {
    let raid = this.rm.tryGetRaid(gymName);
    if (!raid) {
        throw new Error(`No raid at ${gymName}.`);
    }

    let index = this.stops.findIndex((existing) => existing.gym === raid.gym);
    if (index < 0) {
        throw new Error(`Train is not scheduled to stop at ${raid.gym.officialName}`);
    }

    this.stops.splice(index, 1);

    this._estimateStartTimes();
    return raid;
};


RaidTrain.prototype._estimateStartTimes = function () {
    if (this.stops.length > 0) {
        let lastRaidTime = this.stops[0].scheduledStart;
        if (!lastRaidTime) {
            lastRaidTime = this.stops[0].estimatedStart || this.stops[0].raid.hatchTime;
            if (lastRaidTime.getTime() < Date.now()) {
                lastRaidTime = new Date();
            }
        }
        this.stops[0].estimatedStart = lastRaidTime;

        for (let i = 1; i < this.stops.length; i++) {
            if (this.stops[i].scheduledStart) {
                this.stops[i].estimatedStart = this.stops[i].scheduledStart;
            }
            else {
                let estimate = Utils.getDeltaDate(lastRaidTime, 15);
                if (estimate.getTime() < this.stops[i].raid.hatchTime) {
                    estimate = this.stops[i].raid.hatchTime;
                }
                this.stops[i].estimatedStart = estimate;
            }

            lastRaidTime = this.stops[i].estimatedStart;
        }
    }
};

RaidTrain.prototype.getStops = function () {
    return this.stops;
};

const formatParts = [
    { placeholder: "SCHEDULED", replacement: (s) => (s.scheduledStart ? Utils.formatTimeAmPm(s.scheduledStart) : "unknown") },
    { placeholder: "ESTIMATED", replacement: (s) => (s.estimatedStart ? Utils.formatTimeAmPm(s.estimatedStart) : "unknown") },
    { placeholder: "START", replacement: (s) => {
        let time = s.scheduledStart || s.estimatedStart;
        if (time) {
            let timeString = Utils.formatTimeAmPm(time);
            if (!s.scheduledStart) {
                timeString = `[${timeString}]`;
            }
            return timeString;
        }
        return "unknown";
    } },
    { placeholder: "GYM_NAME", replacement: (s) => s.gym.officialName },
    { placeholder: "FRIENDLY_NAME", replacement: (s) => s.gym.friendlyName },
    { placeholder: "RAID", replacement: (s) => Raid.raidToString(s.raid) },
    { placeholder: "TIER", replacement: (s) => s.raid.tier },
    { placeholder: "BOSS_NAME", replacement: (s) => (s.raid.pokemon ? s.raid.pokemon.name : "Undefined") },
    { placeholder: "SPAWN_TIME", replacement: (s) => Utils.formatTimeAmPm(s.raid.spawnTime) },
    { placeholder: "HATCH_TIME", replacement: (s) => Utils.formatTimeAmPm(s.raid.hatchTime) },
    { placeholder: "EXPIRY_TIME", replacement: (s) => Utils.formatTimeAmPm(s.raid.expiryTime) },
    { placeholder: "CITY", replacement: (s) => s.gym.city },
    { placeholder: "MAP_LINK", replacement: (s) => s.gym.mapLink },
    { placeholder: "GUIDE_LINK", replacement: (s) => {
        return s.raid.pokemon ? s.raid.pokemon.guideLink : "http://www.pokebattler.com/raids";
    },
    },
];

const formatOptions = {
    format: "START: RAID",
    parts: formatParts,
};

function stopToString(stop, format) {
    return Format.formatObject(stop, format, formatOptions);
}

RaidTrain.prototype.toStrings = function (stopFormat) {
    let output = [];
    this.stops.forEach((stop) => {
        output.push(stopToString(stop, stopFormat));
    });
    return output;
};

RaidTrain.prototype.toString = function (stopFormat) {
    let output = this.toStrings(stopFormat);
    return ((output.length > 0) ? output.join("\n") : "No stops");
};

module.exports = RaidTrain;
