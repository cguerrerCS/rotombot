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
    this.options = getOptions(options);

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
    };

    if (initOptions) {
        for (let key in options) {
            if (options.hasOwnProperty(key) && initOptions.hasOwnProperty(key)) {
                if (Array.isArray(options[key]) !== Array.isArray(initOptions[key])) {
                    if (Array.isArray(options[key])) {
                        throw new Error(`Cannot set option "${key} must be an array.`);
                    }
                    else {
                        throw new Error(`Cannot set option "${key} cannot be an array.`);
                    }
                }

                if (typeof options[key] !== typeof initOptions[key]) {
                    throw new Error(`Cannot set option "${key}" - expected ${typeof options[key]}, found ${typeof initOptions[key]}.`);
                }
                options[key] = initOptions[key];
            }
        }

        for (let key in initOptions) {
            if (initOptions.hasOwnProperty(key) && (!options.hasOwnProperty(key))) {
                throw new Error(`Unknown init option ${key}.`);
            }
        }
    }

    return options;
}

GymDirectory.prototype.getOption = function (optionName, userOptions) {
    if (!this.options.hasOwnProperty(optionName)) {
        throw new Error(`Unknown option ${optionName}.`);
    }

    if ((!userOptions) || (!userOptions.hasOwnProperty(optionName)) || (userOptions[optionName] === undefined)) {
        return this.options[optionName];
    }

    return userOptions[optionName];
};

GymDirectory.prototype._initSearch = function () {
    const fuseOptions = {
        shouldSort: true,
        caseSensitive: false,
        includeScore: true,
        threshold: 1 - this.options.threshold,
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
};

function listedOrDefault(choices, names) {
    if ((!choices) || (choices.length < 1)) {
        return true;
    }

    if (Array.isArray(names)) {
        let found = false;
        names.forEach((name) => {
            found = found || choices.includes(name);
        });
        return found;
    }

    return choices.includes(names);
}

GymDirectory.prototype.addGym = function (gym) {
    if ((gym instanceof Gym) !== true) {
        throw new Error("All GymDirectory initializers must be Gym objects.");
    }

    if (!listedOrDefault(this.options.requiredZones, gym.normalized.zones)) {
        if (this.options.ignoreOtherZones) {
            return;
        }
        throw new Error(`Gym "${gym.friendlyName}" does not belong to any required zone.`);
    }

    if (!listedOrDefault(this.options.requiredCities, gym.normalized.city)) {
        if (this.options.ignoreOtherCities) {
            return;
        }
        throw new Error(`Gym "${gym.friendlyName}" is not in one of the required cites.`);
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

GymDirectory.prototype.adjustForCitiesAndZones = function (candidates, userOptions) {
    let matched = [];
    let cityMatched = [];
    let zoneMatched = [];
    let unmatched = [];

    let requiredCities = this.getOption("requiredCities", userOptions);
    let requiredZones = this.getOption("requiredZones", userOptions);

    candidates.forEach((candidate) => {
        if (listedOrDefault(requiredCities, candidate.gym.normalized.city) && listedOrDefault(requiredZones, candidate.gym.normalized.zone)) {
            let preferredCities = this.getOption("preferredCities", userOptions);
            let preferredZones = this.getOption("preferredZones", userOptions);
            let inPreferredCity = listedOrDefault(preferredCities, candidate.gym.normalized.city);
            let inPreferredZone = listedOrDefault(preferredZones, candidate.gym.normalized.zones);

            if (inPreferredCity) {
                if (inPreferredZone) {
                    matched.push(candidate);
                }
                else {
                    cityMatched.push(candidate);
                }
            }
            else if (inPreferredZone) {
                zoneMatched.push(candidate);
            }
            else {
                unmatched.push(candidate);
            }
        }
    });

    let result = matched;
    if (result.length < 1) {
        let fallback = unmatched;
        let multiplier = 0.7;
        if (cityMatched.length > 0) {
            fallback = cityMatched;
            multiplier = 0.9;
        }
        else if (zoneMatched.length > 0) {
            fallback = zoneMatched;
            multiplier = 0.8;
        }

        if (fallback.length > 0) {
            result = [];
            fallback.forEach((c) => result.push({ gym: c.gym, score: c.score * multiplier }));
        }
    }

    return result;
};

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

GymDirectory.prototype.tryGetGyms = function (name, userOptions) {
    let candidates = [];
    userOptions = userOptions || {};

    if (userOptions.noExact !== true) {
        candidates = this.tryGetGymsExact(name);
    }

    if ((candidates.length < 1) && (userOptions.noFuzzy !== true)) {
        candidates = this.tryGetGymsFuzzy(name, userOptions);
    }

    if (candidates.length > 1) {
        candidates = this.adjustForCitiesAndZones(candidates, userOptions);
    }

    return candidates;
};

GymDirectory.fromCsvData = function (csv, options) {
    let gyms = [];
    csv.forEach((row) => {
        gyms.push(Gym.fromCsvRow(row));
    });
    return new GymDirectory(gyms, options);
};

module.exports = GymDirectory;

