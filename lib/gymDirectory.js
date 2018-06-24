"use strict";

const Gym = require("./gym");
const Utils = require("./utils");

const Fuse = require("fuse.js");

let GymDirectory = function (gyms, options) {
    if (!gyms || !Array.isArray(gyms) || (gyms.length < 1)) {
        throw new Error("GymDirectory initializer must be an array with at least one element.");
    }

    this.byOfficialName = {};
    this.byFriendlyName = {};
    this.all = [];
    this.ambiguous = [];
    this.options = GymDirectory.getOptions(options);

    this.zones = {};
    this.cities = {};

    gyms.forEach((gym) => this.addGym(gym));
};

GymDirectory.validateOptions = function (options) {
    return (GymDirectory.getOptions(options) !== undefined);
};

GymDirectory.getOptions = function (initOptions) {
    let options = {
        allowedZones: [],
        allowedCities: [],
        throwForNonAllowedZones: false,
        throwForNonAllowedCities: false,
        requiredCities: [],
        requiredZones: [],
        preferredCities: [],
        preferredZones: [],
        threshold: 0.8,
    };
    return GymDirectory.mergeOptions(options, initOptions, { clobber: true });
};

const normalizedOptions = [
    "allowedZones", "allowedCities", "requiredZones", "requiredCities", "preferredZones", "preferredCities",
];

GymDirectory.mergeOptions = function (baseOptions, overrides, mergeOptionsOptions) {
    return Utils.mergeOptions(baseOptions, overrides, mergeOptionsOptions, normalizedOptions);
};

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
                weight: 0.5,
            },
            {
                name: "officialName",
                weight: 0.4,
            },
            {
                name: "city",
                weight: 0.1,
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

GymDirectory.prototype._addZonesAndCity = function (zones, city) {
    let normalizedCity = Utils.normalize(city);
    if (!this.cities.hasOwnProperty(normalizedCity)) {
        this.cities[normalizedCity] = city;
    }
    else if (this.cities[normalizedCity] !== city) {
        throw new Error(`Conflicting city names "${this.cities[normalizedCity]}" and "${city}".`);
    }

    zones.forEach((zone) => {
        let normalized = Utils.normalize(zone);
        if (!this.zones.hasOwnProperty(normalized)) {
            this.zones[normalized] = { displayName: zone, cities: {} };
        }
        else if (this.zones[normalized].displayName !== zone) {
            throw new Error(`Conflicting zone names "${this.zones[normalized].displayName}" and "${zone}".`);
        }
        this.zones[normalized].cities[normalizedCity] = city;
    });
};

function tryGetCity(cityName, cities) {
    let normalized = Utils.normalize(cityName);
    if (cities[cityName]) {
        return {
            displayName: cities[cityName],
            normalized: normalized,
        };
    }
    return undefined;
}

GymDirectory.prototype.tryGetCity = function (cityName) {
    return tryGetCity(cityName, this.cities);
};

GymDirectory.prototype.tryGetZone = function (zoneName) {
    return this.zones[Utils.normalize(zoneName)];
};

GymDirectory.prototype.cityIsInZone = function (zoneName, cityName) {
    let zone = this.tryGetZone(zoneName);
    let city = (zone ? tryGetCity(cityName, zone.cities) : undefined);
    return city !== undefined;
};

GymDirectory.prototype._addGymByOfficialName = function (gym) {
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

GymDirectory.prototype.addGym = function (gym) {
    if ((gym instanceof Gym) !== true) {
        throw new Error("All GymDirectory initializers must be Gym objects.");
    }

    if (!listedOrDefault(this.options.allowedZones, gym.normalized.zones)) {
        if (this.options.throwForNonAllowedZones) {
            throw new Error(`Gym "${gym.friendlyName}" is not in one of the required zones.`);
        }
        return;
    }

    if (!listedOrDefault(this.options.allowedCities, gym.normalized.city)) {
        if (this.options.throwForNonAllowedCities) {
            throw new Error(`Gym "${gym.friendlyName}" is not in one of the required cites.`);
        }
        return;
    }

    if (this.byFriendlyName.hasOwnProperty(gym.normalized.friendlyName)) {
        throw new Error(`Duplicate normalized friendly names "${gym.normalized.friendlyName}".`);
    }

    this._addZonesAndCity(gym.zones, gym.city);

    this.all.push(gym);
    this.byFriendlyName[gym.normalized.friendlyName] = gym;

    this._addGymByOfficialName(gym);

    this.search = undefined;
};

GymDirectory.prototype.adjustForCitiesAndZones = function (candidates, userOptions) {
    let matched = [];
    let cityMatched = [];
    let zoneMatched = [];
    let unmatched = [];

    let requiredCities = this.getOption("requiredCities", userOptions);
    let requiredZones = this.getOption("requiredZones", userOptions);
    let preferredCities = this.getOption("preferredCities", userOptions);
    let preferredZones = this.getOption("preferredZones", userOptions);

    candidates.forEach((candidate) => {
        if (listedOrDefault(requiredCities, candidate.gym.normalized.city) && listedOrDefault(requiredZones, candidate.gym.normalized.zone)) {
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

GymDirectory.processCsvAsync = function (stream, onDone, options) {
    return Utils.processCsvAsync(stream, Gym.fromCsvRow, (gyms) => onDone(new GymDirectory(gyms, options)));
};

GymDirectory.prototype.numGyms = function () { return this.all.length; };
GymDirectory.prototype.getAllGyms = function () { return this.all; };

module.exports = GymDirectory;

