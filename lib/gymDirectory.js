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

    this.zones = new Utils.NormalizedMap(initZone, replaceZone);
    this.cities = new Utils.NormalizedMap(initCity, replaceCity);

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
                weight: 0.8,
            },
            {
                name: "aliases",
                weight: 0.7,
            },
            {
                name: "officialName",
                weight: 0.6,
            },
        ],
    };
    this.search = new Fuse(this.all, fuseOptions); // "RaidData" is the item array
};

function isListed(choices, names) {
    if ((!choices) || (choices.length < 1)) {
        return false;
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

function isDefault(choices) {
    return (!choices) || (choices.length < 1);
}

function isListedOrDefault(choices, names) {
    return isDefault(choices) || isListed(choices, names);
}

function initZone(name, normalized) {
    return {
        name: name,
        normalized: {
            name: normalized,
        },
        cities: new Utils.NormalizedMap(),
    };
}

function replaceZone(existing, name) {
    if (existing.name !== name) {
        throw new Error(`Conflicting zone names "${existing.name}" and "${name}".`);
    }
    return existing;
}

function initCity(name, normalized) {
    return {
        name: name,
        normalized: {
            name: normalized,
        },
        zones: new Utils.NormalizedMap(),
    };
}

function replaceCity(existing, name) {
    if (existing.name !== name) {
        throw new Error(`Conflicting city names "${existing.name}" and "${name}".`);
    }
    return existing;
}

GymDirectory.prototype._addZonesAndCity = function (zones, cityName) {
    let city = this.cities.addOrUpdate(cityName);

    zones.forEach((zoneName) => {
        let zone = this.zones.addOrUpdate(zoneName);
        zone.cities.addOrUpdate(city.normalized.name, zone);
        city.zones.addOrUpdate(zone.normalized.name, city);
    });
};

GymDirectory.prototype.tryGetCity = function (cityName) {
    return this.cities.tryGetElement(cityName);
};

GymDirectory.prototype.getCities = function (cityNames) {
    return this.cities.getElements(cityNames);
};

GymDirectory.prototype.getCityDisplayNames = function (cityNames) {
    let names = [];
    this.cities.getElements(cityNames).forEach((c) => names.push(c.name));
    return names;
};

GymDirectory.prototype.tryGetZone = function (zoneName) {
    return this.zones.tryGetElement(zoneName);
};

GymDirectory.prototype.getZones = function (zoneNames) {
    return this.zones.getElements(zoneNames);
};

GymDirectory.prototype.getZoneDisplayNames = function (zoneNames) {
    let names = [];
    this.zones.getElements(zoneNames).forEach((z) => names.push(z.name));
};

GymDirectory.prototype.cityIsInZone = function (zoneName, cityName) {
    let zone = this.tryGetZone(zoneName);
    return zone && zone.cities.containsName(cityName);
};

GymDirectory.prototype.forEachCity = function (func, zone) {
    if (typeof zone === "string") {
        let found = this.tryGetZone(zone);
        if (!found) {
            throw new Error(`Unknown zone name "${zone}".`);
        }
        zone = found;
    }

    let cities = (zone ? zone.cities : this.cities);
    cities.forEach(func);
};

GymDirectory.prototype.forEachZone = function (func) {
    this.zones.forEach(func);
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

    if (!isListedOrDefault(this.options.allowedZones, gym.normalized.zones)) {
        if (this.options.throwForNonAllowedZones) {
            throw new Error(`Gym "${gym.friendlyName}" is not in one of the required zones.`);
        }
        return;
    }

    if (!isListedOrDefault(this.options.allowedCities, gym.normalized.city)) {
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

GymDirectory.prototype.categorizeGyms = function (gyms, lookupOptions) {
    let matched = [];
    let cityMatched = [];
    let zoneMatched = [];
    let unmatched = [];

    let requiredCities = this.getOption("requiredCities", lookupOptions);
    let requiredZones = this.getOption("requiredZones", lookupOptions);
    let preferredCities = this.getOption("preferredCities", lookupOptions);
    let preferredZones = this.getOption("preferredZones", lookupOptions);

    gyms.forEach((gym) => {
        if (isListedOrDefault(requiredCities, gym.normalized.city) && isListedOrDefault(requiredZones, gym.normalized.zone)) {
            let inPreferredCity = isListed(preferredCities, gym.normalized.city);
            let inPreferredZone = isListed(preferredZones, gym.normalized.zones);

            if (inPreferredCity) {
                if (inPreferredZone) {
                    matched.push(gym);
                }
                else {
                    cityMatched.push(gym);
                }
            }
            else if (inPreferredZone) {
                zoneMatched.push(gym);
            }
            else {
                unmatched.push(gym);
            }
        }
    });

    return {
        matched: matched,
        inPreferredCity: cityMatched,
        inPreferredZone: zoneMatched,
        unmatched: unmatched,
    };
};

GymDirectory.prototype.chooseBestGymsForLookupOptions = function (gyms, userOptions) {
    let cat = this.categorizeGyms(gyms, userOptions);
    if (cat.matched && (cat.matched.length > 0)) {
        return cat.matched;
    }
    else if (cat.inPreferredCity && (cat.inPreferredCity.length > 0)) {
        return cat.inPreferredCity;
    }
    else if (cat.inPreferredZone && (cat.inPreferredZone.length > 0)) {
        return cat.inPreferredZone;
    }

    if (cat.unmatched.length > 0) {
        if (!isDefault(userOptions.preferredZones) || !isDefault(userOptions.preferredCities)) {
            // only return unmatched gyms if there are no preferences
            return [];
        }
    }
    return cat.unmatched;
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
        if (isListedOrDefault(requiredCities, candidate.gym.normalized.city) && isListedOrDefault(requiredZones, candidate.gym.normalized.zone)) {
            let inPreferredCity = isListed(preferredCities, candidate.gym.normalized.city);
            let inPreferredZone = isListed(preferredZones, candidate.gym.normalized.zones);

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
        let fallback = undefined;
        let multiplier = 1.0;

        if (cityMatched.length > 0) {
            fallback = cityMatched;
            multiplier = (isDefault(preferredZones) ? 1.0 : 0.9);
        }
        else if (zoneMatched.length > 0) {
            fallback = zoneMatched;
            multiplier = (isDefault(preferredCities) ? 1.0 : 0.8);
        }
        else {
            fallback = unmatched;
            multiplier = (isDefault(preferredCities) && isDefault(preferredZones)) ? 1.0 : 0.7;
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
    let normalized = Utils.normalize(name);
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

    if (candidates.length > 0) {
        candidates = this.adjustForCitiesAndZones(candidates, userOptions);
    }

    return candidates;
};

GymDirectory.mergeExternalId = function (into, from) {
    let gymsByLongitude = {};
    from.all.forEach((gym) => {
        if (!gymsByLongitude[gym.longitude]) {
            gymsByLongitude[gym.longitude] = {};
        }
        gymsByLongitude[gym.longitude][gym.latitude] = gym;
    });

    into.all.forEach((gym) => {
        if (gymsByLongitude[gym.longitude] && gymsByLongitude[gym.longitude][gym.latitude]) {
            gym.uid = gymsByLongitude[gym.longitude][gym.latitude].uid;
        }
        else {
            console.log(`Gym ${JSON.stringify(gym)} not found in source gyms.`);
        }
    });
};

GymDirectory.prototype.toCsvData = function () {
    let output = ["external_id,Zones,City,Official Name,Friendly Name,Longitude,Latitude,ExStatus"];
    this.all.forEach((gym) => {
        output.push(gym.toCsvRow());
    });
    return output;
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

