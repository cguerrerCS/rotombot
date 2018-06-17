"use strict";

const Gym = require("./gym");
const GymZone = require("./gymZone");

var GymCollection = function (gyms, options) {
    this.all = new GymZone(gyms, undefined);
    this.zones = {};
    if (options && options.zones) {
        options.zones.forEach((zoneName) => {
            if (this.zones[zoneName]) {
                throw new Error(`Zone "${zoneName}" declared multiple times.`);
            }

            this.zones[zoneName] = new GymZone(gyms, zoneName, { ignoreOtherZones: true });
        });
    }
};

GymCollection.prototype.tryGetGym = function (name, options) {
    let candidates = this.all.tryGetGymsExact(name, options);
    options = options || {};

    if ((!candidates) || (candidates.length < 1)) {
        for (let zoneName in this.zones) {
            if ((!candidates) || (candidates.length < 1)) {
                if ((!options.zones) || options.zones.includes(zoneName)) {
                    if (this.zones.hasOwnProperty(zoneName)) {
                        let zone = this.zones[zone];
                        candidates = zone.tryGetGymsFuzzy(options);
                    }
                }
            }
        }
    }

    if (candidates && (candidates.length > 1) && (options.cities && (options.cities.length > 0))) {
        candidates = GymZone.adjustForCities(candidates, options);
    }

    return ((candidates && (candidates.length > 0)) ? candidates[0] : undefined);
};

GymCollection.fromCsvData = function (csv, options) {
    let gyms = [];
    csv.forEach((row) => {
        gyms.push(Gym.fromCsvRow(row));
    });
    return new GymCollection(gyms, options);
}

module.exports = GymCollection;
