"use strict";

let CsvReader = require("csv-reader");

let Utils = function () {
};

Utils.formatTimeAmPm = function (date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    let strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
};

Utils.normalizeString = function (input) {
    if (typeof input !== "string") {
        throw new Error(`Cannot normalize an input of type ${typeof input}.`);
    }

    let trimmed = input.trim();
    if (trimmed.length < 1) {
        throw new Error("Cannot normalize an empty name.");
    }
    return trimmed.toLowerCase().replace(/[\W]/g, "");
};

Utils.normalizeStrings = function (input) {
    let normalized = [];
    input.forEach((name) => normalized.push(Utils.normalizeString(name)));
    return normalized;
};

Utils.normalize = function (input) {
    if (Array.isArray(input)) {
        return Utils.normalizeStrings(input);
    }
    return Utils.normalizeString(input);
};

Utils.forOwn = function (obj, func) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            func(obj[key], key);
        }
    }
};

Utils.processCsvAsync = function (stream, onItem, onDone) {
    let collection = [];
    return stream.pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
        .on("data", function (row) {
            collection.push(onItem(row));
        })
        .on("end", function () {
            onDone(collection);
        });
};

// if we need required fields we can expand toNormalize out into an object with additional constraints
Utils.mergeOptions = function (baseOptions, overrides, mergeOptionsOptions, toNormalize) {
    mergeOptionsOptions = mergeOptionsOptions || {};

    if ((Array.isArray(baseOptions) || (typeof baseOptions !== "object"))
        || (overrides && (Array.isArray(overrides) || (typeof overrides !== "object")))) {
        throw new Error("Options must be supplied as an object.");
    }

    if (!mergeOptionsOptions.clobber) {
        let json = JSON.stringify(baseOptions);
        baseOptions = JSON.parse(json);
    }

    if (overrides) {
        for (let key in baseOptions) {
            if (baseOptions.hasOwnProperty(key) && overrides.hasOwnProperty(key)) {
                if (Array.isArray(baseOptions[key]) !== Array.isArray(overrides[key])) {
                    if (Array.isArray(baseOptions[key])) {
                        throw new Error(`Cannot set option "${key}" - must be an array.`);
                    }
                    else {
                        throw new Error(`Cannot set option "${key}" - cannot be an array.`);
                    }
                }

                if ((baseOptions[key] === undefined) || (overrides[key] === undefined)) {
                    throw new Error(`Cannot set option "${key}" - undefined not allowed, use null instead.`);
                }

                if ((baseOptions[key] !== null) && (overrides[key] !== null)) {
                    if (typeof baseOptions[key] !== typeof overrides[key]) {
                        throw new Error(`Cannot set option "${key}" - expected ${typeof baseOptions[key]}, found ${typeof overrides[key]}.`);
                    }
                }

                baseOptions[key] = overrides[key];
            }
        }

        for (let key in overrides) {
            if (overrides.hasOwnProperty(key) && (!baseOptions.hasOwnProperty(key))) {
                throw new Error(`Unknown init option ${key}.`);
            }
        }

        if (toNormalize && (!mergeOptionsOptions.noNormalize)) {
            toNormalize.forEach((fieldName) => {
                let value = baseOptions[fieldName];

                if ((typeof value === "string") || (Array.isArray(value) && (value.length > 0))) {
                    baseOptions[fieldName] = Utils.normalize(value);
                }
            });
        }
    }

    return baseOptions;
};

module.exports = Utils;
