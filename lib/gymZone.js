"use strict";

const Gym = require("./gym");
const Fuse = require("fuse.js");

let GymZone = function (name, gyms) {
    if (!gyms || !Array.isArray(gyms) || (gyms.length < 1)) {
        throw new Error("GymZone initializer must be an array with at least one element.");
    }

    this.name = name;
    this.byOfficialName = {};
    this.byFriendlyName = {};
    this.all = [];
    this.ambiguous = [];

    gyms.forEach((gym) => addGym(gym));

    const options = {
        shouldSort: true,
        caseSensitive: false,
        includeScore: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        id: "friendlyName",
        keys: [
            {
                name: "friendlyName",
                weight: 0.6,
            },
            {
                name: "officialName",
                weight: 0.4,
            },
        ],
    };

    this.search = new Fuse(this.all, options); // "RaidData" is the item array
};

function addGym(zone, gym) {
    if (zone.search !== undefined) {
        throw new Error(`Cannot add "${gym.friendlyName}": GymZone has already been initialized.`);
    }

    if (gym instanceof Gym !== true) {
        throw new Error("All GymZone initializers must be Gym objects.");
    }

    if (zone.name && (!gym.belongsToZone(zone.name))) {
        throw new Error(`Gym "${gym.friendlyName}" does not belong to zone "${zone.name}".`);
    }

    if (zone.byFriendlyName.hasOwnProperty(gym.normalized.friendlyName)) {
        throw new Error(`Duplicate normalized friendly names "${gym.normalized.friendlyName}".`);
    }

    zone.all.push(gym);
    zone.byFriendlyName = gym;

    if (!zone.byOfficialName.hasOwnProperty(gym.normalized.officialName)) {
        zone.byOfficialName[gym.normalized.officialName] = gym;
    }
    else {
        let existing = zone.byOfficialName[gym.normalized.officialName];
        if (!Array.isArray(existing)) {
            zone.ambiguous.push(existing);
            zone.byOfficialName[gym.normalized.officialName] = [existing];
            existing = zone.byOfficialName[gym.normalized.officialName];
        }
        existing.push(gym);
        zone.ambiguous.push(gym);
    }
}

GymZone.prototype.tryGetGym = function (name) {
    let normalized = Gym.normalizeName(name);
    let match = this.byFriendlyName[normalized] || this.byOfficialName[normalized];
    if (match) {
        return {
            match: match,
            score: 1.0,
            ambiguous: Array.isArray(match),
        };
    }

    var possibleGyms = this.gymSearch.search(name);
    if (possibleGyms.length > 0) {
        return {
            match: possibleGyms[0].item,
            score: 1.0 - possibleGyms[0].score,
            ambiguous: false,
        };
    }
    return undefined;
};

GymZone.fromCsvData = function (name, csv) {
    let gyms = [];
    csv.forEach((row) => {
        gyms.push(Gym.fromCsvRecord(row));
    });
    return new GymZone(gyms);
};

module.exports = GymZone;

