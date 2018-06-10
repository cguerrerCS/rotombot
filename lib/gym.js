"use strict";

function Gym(init) {
    validateInitializer(init);
    this.zones = init.zones;
    this.city = init.city;
    this.officialName = {
        display: init.officialName,
        normalized: normalizeName(init.officialName),
    };
    this.friendlyName = {
        display: init.friendlyName,
        normalized: normalizeName(init.friendlyName),
    };
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
    ok = ok && (typeof init.longitude === "number");
    ok = ok && (typeof init.latitude === "number");
    ok = ok && (init.isExEligible !== undefined) && (typeof init.isExEligible === "boolean");
    if (!ok) {
        throw new Error(`Invalid gym initializer: ${JSON.stringify(init)}`);
    }
}

function normalizeName(name) {
    return name.trim().toLowerCase().replace(/[\W]/g, "");
}

function validateExStatus(status) {
    switch (status.toLowerCase()) {
        case "nonex":
            return false;
        case "exeligible":
            return true;
        default:
            throw new Error(`Unknown EX status "${status}"`);
    }
}

Gym.parseCsvRecord = function (csv) {
    return {
        zones: csv[0].split("|"),
        city: csv[1],
        officialName: csv[2],
        friendlyName: csv[3],
        longitude: Number(csv[4]),
        latitude: Number(csv[5]),
        isExEligible: validateExStatus(csv[6]),
    };
};

Gym.fromCsvRecord = function (csv) {
    return new Gym(Gym.parseCsvRecord(csv));
};

module.exports = {
    fromCsvRecord: Gym.fromCsvRecord,
};
