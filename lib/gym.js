"use strict";

const Utils = require("./utils");

function Gym(init) {
    validateInitializer(init);
    this.zones = init.zones;
    this.city = init.city;
    this.officialName = init.officialName;
    this.friendlyName = init.friendlyName;
    this.normalized = {
        officialName: Utils.normalize(init.officialName),
        friendlyName: Utils.normalize(init.friendlyName),
        city: Utils.normalize(init.city),
        zones: Utils.normalize(this.zones),
    };
    this.key = this.normalized.friendlyName;

    this.longitude = init.longitude;
    this.latitude = init.latitude;

    this.isExEligible = init.isExEligible;
    this.mapLink = `https://www.google.com/maps/dir/?api=1&destination=${init.longitude},${init.latitude}`;
}

function validateInitializer(init) {
    let ok = init && Array.isArray(init.zones) && (init.zones.length > 0);
    ok = ok && (typeof init.city === "string") && (init.city.trim().length > 0);
    ok = ok && (typeof init.officialName === "string") && (init.officialName.trim().length > 0);
    ok = ok && (typeof init.friendlyName === "string") && (init.friendlyName.trim().length > 0);
    ok = ok && Number.isFinite(init.longitude);
    ok = ok && Number.isFinite(init.latitude);
    ok = ok && (typeof init.isExEligible === "boolean");
    if (!ok) {
        throw new Error(`Invalid gym initializer: ${JSON.stringify(init)}`);
    }
}

function parseZones(spec) {
    let ok = false;

    if (spec) {
        if (typeof spec === "string") {
            spec = spec.split("|");
        }

        if (Array.isArray(spec)) {
            ok = true;
            spec.forEach((zone) => {
                ok = ok && (typeof zone === "string") && (zone.trim().length > 0);
            });
        }
    }

    return ok ? spec : undefined;
}

function parseExStatus(status) {
    if (typeof status !== "boolean") {
        switch (status && status.toLowerCase()) {
            case "nonex":
                return false;
            case "exeligible":
                return true;
            default:
                return undefined;
        }
    }
    return status;
}

Gym.parseCsvRow = function (csv) {
    return {
        zones: parseZones(csv[0]),
        city: csv[1],
        officialName: csv[2],
        friendlyName: csv[3],
        longitude: (typeof csv[4] === "number" ? csv[4] : parseFloat(csv[4])),
        latitude: (typeof csv[5] === "number" ? csv[5] : parseFloat(csv[5])),
        isExEligible: parseExStatus(csv[6]),
    };
};

Gym.fromCsvRow = function (csv) {
    return new Gym(Gym.parseCsvRow(csv));
};

Gym.prototype.belongsToZone = function (zones) {
    zones = Array.isArray(zones) ? zones : [zones];
    let match = false;
    zones.forEach((z) => { match = match || this.normalized.zones.includes(Utils.normalize(z)); });
    return match;
};

module.exports = Gym;
