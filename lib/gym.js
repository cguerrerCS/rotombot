"use strict";

function Gym(init) {
    validateInitializer(init);
    this.zones = init.zones;
    this.city = init.city;
    this.officialName = init.officialName;
    this.friendlyName = init.friendlyName;
    this.normalized = {
        officialName: Gym.normalizeName(init.officialName),
        friendlyName: Gym.normalizeName(init.friendlyName),
        city: Gym.normalizeName(init.city),
        zones: Gym.normalizeNames(this.zones),
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
    ok = ok && Number.isFinite(init.longitude);
    ok = ok && Number.isFinite(init.latitude);
    ok = ok && (typeof init.isExEligible === "boolean");
    if (!ok) {
        throw new Error(`Invalid gym initializer: ${JSON.stringify(init)}`);
    }
}

Gym.normalizeName = function (name) {
    let trimmed = name.trim();
    if (trimmed.length < 1) {
        throw new Error("Cannot normalize an empty name.");
    }
    return trimmed.toLowerCase().replace(/[\W]/g, "");
};

Gym.normalizeNames = function (names) {
    let normalized = [];
    names.forEach((name) => normalized.push(Gym.normalizeName(name)));
    return normalized;
};

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

Gym.prototype.belongsToZone = function (zone) {
    return this.normalized.zones.includes(Gym.normalizeName(zone));
};

module.exports = Gym;
