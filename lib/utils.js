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

module.exports = Utils;
