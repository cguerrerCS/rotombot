"use strict";

const fs = require("fs");
const GymDirectory = require("../lib/gymDirectory");

let oldGymsStream = fs.createReadStream("data/Gyms.csv", "utf8");
let newGymsStream = fs.createReadStream("data/Gyms-new.csv", "utf8");

GymDirectory.processCsvAsync(oldGymsStream, (oldGyms) => {
    GymDirectory.processCsvAsync(newGymsStream, (newGyms) => {
        GymDirectory.mergeExternalId(newGyms, oldGyms);
        let output = newGyms.toCsvData();
        fs.writeFileSync("data/Gyms-merged.csv", output.join("\n"), { encoding: "utf8", flag: "w" });
    });
});
