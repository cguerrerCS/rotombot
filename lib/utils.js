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
