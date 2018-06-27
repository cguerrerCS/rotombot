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

Gym.prototype.toString = function (format) {
    format = format || "Name: *GYM_NAME*\nFriendly Name: *FRIENDLY_NAME*\nEx-Eligible: *IS_EX*\nCity: *CITY*\nZones: *ZONES*\nDirections: _<MAP_LINK>_\n";

    const parts = [
        { placeholder: "GYM_NAME", replacement: (g) => g.officialName },
        { placeholder: "FRIENDLY_NAME", replacement: (g) => g.friendlyName },
        { placeholder: "IS_EX", replacement: (g) => (g.isExEligible ? "YES" : "No") },
        { placeholder: "CITY", replacement: (g) => g.city },
        { placeholder: "ZONES", replacement: (g) => g.zones.join(", ") },
        { placeholder: "MAP_LINK", replacement: (g) => g.mapLink },
    ];

    parts.forEach((part) => {
        format = format.replace(part.placeholder, part.replacement(this));
    });

    return format;
};

Gym.prototype.toDiscordMessage = function () {
    let message = {
        content: this.toString(),
        embed: {
            color: 3447003,
            title: this.friendlyName,
            //url: this.mapLink,
            description: this.toString("CITY [(Directions)](MAP_LINK)"),
            thumbnail: {
                url: `http://www.didjaredo.com/pogo/images/48x48/${this.isExEligible ? "gym_ex" : "gym"}.png`,
            },
            fields: [],
        },
    };

    if (this.friendlyName !== this.officialName) {
        message.embed.fields.push({ name: "Official name", value: this.officialName });
    }

    return message;
};

module.exports = Gym;
