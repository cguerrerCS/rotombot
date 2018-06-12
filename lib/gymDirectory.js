"use strict";

const Gym = require("./gym");
const Fuse = require("fuse.js");

let GymDirectory = function (gyms, options) {
    if (!gyms || !Array.isArray(gyms) || (gyms.length < 1)) {
        throw new Error("GymDirectory initializer must be an array with at least one element.");
    }
    options = options || {};

    this.byOfficialName = {};
    this.byFriendlyName = {};
    this.all = [];
    this.ambiguous = [];
    this.preferredZones = options.preferredZones || [];
    this.requiredZones = options.requiredZones || [];
    this.preferredCities = options.preferredCities || [];
    this.requiredCities = options.requiredCities || [];
    this.threshold = (options.threshold ? 1 - options.threshold : 0.2);
    this.search = undefined;

    gyms.forEach((gym) => this.addGym(gym, options));
};

function getOptions(initOptions) {
    let options = {
        ignoreOtherZones: true,
        preferredZones: [],
        requiredZones: [],
        ignoreOtherCities: true,
        preferredCities: [],
        requiredCities: [],
        threshold: 0.8,
    }
}

GymDirectory.prototype._initSearch() {
    const fuseOptions = {
        shouldSort: true,
        caseSensitive: false,
        includeScore: true,
        threshold: (options && (typeof options.fuzzyThreshold === "number")) ? options.fuzzyThreshold : 0.2,
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
    this.search = new Fuse(this.all, fuseOptions); // "RaidData" is the item array
}

function listedOrDefault(choices, names) {
    if ((!choices) || (choices.length < 1)) {
        return true;
    }

    if (Array.isArray(names)) {
        let found = false;
        names.forEach((name) => {
            found = found || choices.includes(names);
        })
        return found;
    }

    return choices.includes(names);
}

GymDirectory.prototype.addGym = function (gym, options) {
    if ((gym instanceof Gym) !== true) {
        throw new Error("All GymDirectory initializers must be Gym objects.");
    }

    if (!listedOrDefault(this.requiredZones, gym.normalized.zones)) {
        if (options && options.ignoreOtherZones) {
            return;
        }
        throw new Error(`Gym "${gym.friendlyName}" does not belong to any required zone.`);
    }

    if (!listedOrDefault(this.requiredCities, gym.normalized.city)) {
        if (options && options.ignoreOtherCities) {
            return;
        }
        throw new Error(`Gym "${friendlyName}" is not in one of the required cites.`);
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

    this.search = undefined;
};

GymDirectory.adjustForCities = function (candidates, options) {
    let matched = [];
    let unmatched = [];

    let cities = Gym.normalizeNames(options.cities);
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

    return (matched.length > 0) || (options && options.onlyMatchingCities) ? matched : unmatched;
}

GymDirectory.prototype.tryGetGymsExact = function (name) {
    let candidates = [];
    let normalized = Gym.normalizeName(name);
    let exact = this.byFriendlyName[normalized] || this.byOfficialName[normalized];
    if (exact) {
        (Array.isArray(exact) ? exact : [exact]).forEach((gym) => {
            candidates.push({
                gym: gym,
                score: 1,
            });
        });
    }
    return candidates;
};

GymDirectory.prototype.tryGetGymsFuzzy = function (name) {
    let candidates = [];

    if (!this.search) {
        this._initSearch();
    }

    let matches = this.search.search(name);
    if (matches.length > 0) {
        matches.forEach((match) => {
            candidates.push({
                gym: match.item,
                score: 1 - match.score,
            });
        });
    }

    return candidates;
};

GymDirectory.prototype.tryGetGyms = function (name, options) {
    let candidates = [];
    options = options || {};

    if (options.noExact !== true) {
        candidates = this.tryGetGymsExact(name);
    }

    if ((candidates.length < 1) && (options.noFuzzy !== true)) {
        candidates = this.tryGetGymsFuzzy(name, options);
    }

    if ((candidates.length > 1) && (options.cities && (options.cities.length > 0))) {
        candidates = GymDirectory.adjustForCities(candidates, options);
    }

    return candidates;
};

GymDirectory.fromCsvData = function (csv, name, options) {
    let gyms = [];
    csv.forEach((row) => {
        gyms.push(Gym.fromCsvRow(row));
    });
    return new GymDirectory(gyms, name, options);
};

module.exports = GymDirectory;

