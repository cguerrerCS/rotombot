"use strict";

const Gym = require("./gym");
const Fuse = require("fuse.js");

let GymZone = function (gyms, name) {
    if (!gyms || !Array.isArray(gyms) || (gyms.length < 1)) {
        throw new Error("GymZone initializer must be an array with at least one element.");
    }

    this.name = name;
    this.byOfficialName = {};
    this.byFriendlyName = {};
    this.all = [];
    this.ambiguous = [];

    gyms.forEach((gym) => this.addGym(gym));

    const options = {
        shouldSort: true,
        caseSensitive: false,
        includeScore: true,
        threshold: 0.2,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
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

GymZone.prototype.addGym = function (gym) {
    if (this.search !== undefined) {
        throw new Error(`Cannot add "${gym.friendlyName}": GymZone has already been initialized.`);
    }

    if ((gym instanceof Gym) !== true) {
        throw new Error("All GymZone initializers must be Gym objects.");
    }

    if (this.name && (!gym.belongsToZone(this.name))) {
        throw new Error(`Gym "${gym.friendlyName}" does not belong to zone "${this.name}".`);
    }

    if (this.byFriendlyName.hasOwnProperty(gym.normalized.friendlyName)) {
        throw new Error(`Duplicate normalized friendly names "${gym.normalized.friendlyName}".`);
    }

    this.all.push(gym);
    this.byFriendlyName[gym.normalized.friendlyName] = gym;

    if (!this.byOfficialName.hasOwnProperty(gym.normalized.officialName)) {
        this.byOfficialName[gym.normalized.officialName] = gym;
    }
    else {
        let existing = this.byOfficialName[gym.normalized.officialName];
        if (!Array.isArray(existing)) {
            this.ambiguous.push(existing);
            this.byOfficialName[gym.normalized.officialName] = [existing];
            existing = this.byOfficialName[gym.normalized.officialName];
        }
        existing.push(gym);
        this.ambiguous.push(gym);
    }
};

function adjustForCities(candidates, cities) {
    let matched = [];
    let unmatched = [];

    cities = Gym.normalizeNames(cities);
    candidates.forEach((candidate) => {
        if (cities.includes(candidate.gym.normalized.city)) {
            matched.push(candidate);
        }
        else {
            unmatched.push({
                gym: candidate.gym,
                score: candidate.score * 0.9,
            });
        }
    });

    return (matched.length > 0) ? matched : unmatched;
}

GymZone.prototype.tryGetGyms = function (name, cities) {
    let candidates = [];
    let normalized = Gym.normalizeName(name);

    // try for exact match on friendly name or official name
    let exact = this.byFriendlyName[normalized] || this.byOfficialName[normalized];
    if (exact) {
        (Array.isArray(exact) ? exact : [exact]).forEach((gym) => {
            candidates.push({
                gym: gym,
                score: 1,
            });
        });
    }
    else {
        let matches = this.search.search(name);
        if (matches.length > 0) {
            matches.forEach((match) => {
                candidates.push({
                    gym: match.item,
                    score: 1 - match.score,
                });
            });
        }
    }

    if ((candidates.length > 1) && (cities && (cities.length > 0))) {
        candidates = adjustForCities(candidates, cities);
    }

    return candidates;
};

GymZone.fromCsvData = function (csv, name) {
    let gyms = [];
    csv.forEach((row) => {
        gyms.push(Gym.fromCsvRow(row));
    });
    return new GymZone(gyms, name);
};

module.exports = GymZone;

