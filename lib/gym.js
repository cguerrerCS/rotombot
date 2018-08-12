"use strict";

const Utils = require("./utils");
const Format = require("./format");

function Gym(init) {
    validateInitializer(init);
    this.uid = init.uid;
    this.zones = init.zones;
    this.city = init.city;
    this.officialName = init.officialName;
    this.friendlyName = init.friendlyName;
    this.aliases = init.aliases || [];
    this.normalized = {
        officialName: Utils.normalize(init.officialName),
        friendlyName: Utils.normalize(init.friendlyName),
        aliases: Utils.normalize(init.aliases),
        city: Utils.normalize(init.city),
        zones: Utils.normalize(this.zones),
    };
    this.key = this.normalized.friendlyName;

    this.longitude = init.longitude;
    this.latitude = init.latitude;

    this.isExEligible = init.isExEligible;
    this.mapLink = `https://www.google.com/maps/dir/?api=1&destination=${init.latitude},${init.longitude}`;
}

function validateInitializer(init) {
    let ok = init && Array.isArray(init.zones) && (init.zones.length > 0);
    ok = ok && (typeof init.uid === "string") && (init.uid.trim().length > 0);
    ok = ok && (typeof init.city === "string") && (init.city.trim().length > 0);
    ok = ok && (typeof init.officialName === "string") && (init.officialName.trim().length > 0);
    ok = ok && (typeof init.friendlyName === "string") && (init.friendlyName.trim().length > 0);
    ok = ok && ((!init.aliases) || Array.isArray(init.aliases));
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
    let aliases = (csv[4] ? csv[4].split("|") : undefined);
    let friendlyName = (aliases ? aliases.shift() : undefined);
    return {
        uid: csv[0],
        zones: parseZones(csv[1]),
        city: csv[2],
        officialName: csv[3],
        friendlyName: friendlyName,
        aliases: aliases,
        longitude: (typeof csv[5] === "number" ? csv[5] : parseFloat(csv[5])),
        latitude: (typeof csv[6] === "number" ? csv[6] : parseFloat(csv[6])),
        isExEligible: parseExStatus(csv[7]),
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

const formatOptions = {
    format: { destination: "markdown" },
    formatsByDestination: {
        "text": "Name: GYM_NAME\nFriendly Name: FRIENDLY_NAME\nEx-Eligible: IS_EX\nCity: CITY\nZones: ZONES\nDirections: _<MAP_LINK>_\n",
        "markdown": "Name: *GYM_NAME*\nFriendly Name: *FRIENDLY_NAME*\nEx-Eligible: *IS_EX*\nCity: *CITY*\nZones: *ZONES*\nDirections: _<MAP_LINK>_\n",
        "embed": "Name: *GYM_NAME*\nFriendly Name: *FRIENDLY_NAME*\nEx-Eligible: *IS_EX*\nCity: *CITY*\nZones: *ZONES*\n[Directions:](MAP_LINK)\n",
    },
    parts: [
        { placeholder: "GYM_NAME", replacement: (g) => g.officialName },
        { placeholder: "FRIENDLY_NAME", replacement: (g) => g.friendlyName },
        { placeholder: "ALIASES", replacement: (g) => g.aliases.join(", ") },
        { placeholder: "IS_EX", replacement: (g) => (g.isExEligible ? "YES" : "No") },
        { placeholder: "CITY", replacement: (g) => g.city },
        { placeholder: "ZONES", replacement: (g) => g.zones.join(", ") },
        { placeholder: "MAP_LINK", replacement: (g, o) => (o && o.destination === "embed") ? `[Directions](${g.mapLink})` : g.mapLink },
    ],
};

Gym.prototype.toString = function (format) {
    return Format.formatObject(this, format, formatOptions);
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

    if (this.aliases.length > 0) {
        message.embed.fields.push({ name: "Aliases", value: this.toString("ALIASES") });
    }

    message.embed.fields.push({ name: "uid", value: this.uid });
    if (this.isExEligible) {
        message.embed.footer = { text: "Ex-eligible" };
    }
    return message;
};

module.exports = Gym;
