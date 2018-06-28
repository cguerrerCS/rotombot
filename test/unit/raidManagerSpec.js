"use strict";

const fs = require("fs");
const path = require("path");
const GymDirectory = require("../../lib/gymDirectory");
const RaidManager = require("../../lib/raidManager");
const { FlexTime } = require("botsbits");

const bosses = [
    { name: "Latias", tier: "Tier 5", status: "active" },
    { name: "Kyogre", tier: "Tier 5", status: "active" },
    { name: "Ho-oh", tier: "Tier 5", status: "active" },
    { name: "Zapdos", tier: "Tier 5", status: "inactive" },
    { name: "Houndoom", tier: "Tier 4", status: "active" },
    { name: "Tyranitar", tier: "Tier 4", status: "active" },
    { name: "Aggron", tier: "Tier 4", status: "active" },
    { name: "Absol", tier: "Tier 4", status: "active" },
    { name: "Walrein", tier: "Tier 4", status: "active" },
    { name: "Machamp", tier: "Tier 3", status: "active" },
    { name: "Gengar", tier: "Tier 3", status: "active" },
    { name: "Jynx", tier: "Tier 3", status: "active" },
    { name: "Pinsir", tier: "Tier 3", status: "active" },
    { name: "Granbull", tier: "Tier 3", status: "active" },
    { name: "Piloswine", tier: "Tier 3", status: "active" },
    { name: "Exeggutor", tier: "Tier 2", status: "active" },
    { name: "Misdreavus", tier: "Tier 2", status: "active" },
    { name: "Sneasel", tier: "Tier 2", status: "active" },
    { name: "Sableye", tier: "Tier 2", status: "active" },
    { name: "Mawile", tier: "Tier 2", status: "active" },
    { name: "Magikarp", tier: "Tier 1", status: "active" },
    { name: "Wailmer", tier: "Tier 1", status: "active" },
    { name: "Swablu", tier: "Tier 1", status: "active" },
    { name: "Shuppet", tier: "Tier 1", status: "active" },
    { name: "Duskull", tier: "Tier 1", status: "active" },
    { name: "Snorunt", tier: "Tier 1", status: "active" },
];

const badBosses = [
    { Name: "Latias", tier: "Tier 5" },
    { name: "Tyranitar", TIER: "Tier 6" },
    { name: "Ho-oh" },
    { tier: "Tier 4" },
];

const gymSpecs = [
    // Zones,City,Official Name,Friendly Name,Longitude,Latitude,ExStatus
    ["Rain City", "Redmond", "Cleveland Fountain", "Cleveland Fountain", 47.673667, -122.125595, "NonEx"],
    ["Rain City", "Redmond", "Gridlock Light Sculpture", "Gridlock", 47.673298, -122.125256, "ExEligible"],
    ["Rain City", "Redmond", "Painted Parking Lot", "Painted Parking Lot", 47.672712, -122.124617, "ExEligible"],
    ["Rain City", "Redmond", "Redmond Town Center Fish Statue", "Farmers Market", 47.671892, -122.124425, "ExEligible"],
    ["Rain City", "Redmond", "Redmond Clock Tower",  "Clock Tower", 47.674170,  -122.123056, "NonEx"],
    ["Rain City", "Redmond", "Victors Coffee Co. and Roasters",  "Victors Coffeeshop", 47.674577,  -122.121900, "NonEx"],
    ["Rain City", "Redmond", "Redmond's Erratic",  "Redmond Erratic", 47.671955,  -122.119251, "NonEx"],
    ["Rain City", "Redmond", "Kids Playing Baseball Mural",  "Mattress Firm", 47.672620,  -122.116819, "NonEx"],
    ["Rain City", "Redmond", "BJ's Brewmural", "BJs Brewhouse", 47.668914,  -122.119748, "NonEx"],
    ["Rain City", "Redmond", "Mural (Wells Fargo)", "Wells Fargo", 47.678650,  -122.127309, "NonEx"],
    ["Rain City", "Redmond", "Wisdom Seekers in Redmond", "Redmond Library", 47.678799,  -122.128532, "NonEx"],
    ["Rain City", "Redmond", "Luke McRedmond's Paired Beavers", "Luke McRedmond", 47.673250,  -122.132160, "NonEx"],
    ["Rain City", "Redmond", "Soulfood Books and Cafe", "Soul Foods", 47.675219,  -122.130386, "NonEx"],
    ["Rain City", "Redmond", "West Ironcycle", "Ben Franklin", 47.675691,  -122.130123, "NonEx"],
    ["Rain City", "Redmond", "Hunting Fox", "city Hall", 47.678920,  -122.130520, "NonEx"],
    ["Rain City", "Redmond", "Weiner Elephants", "Redmond PD", 47.680386,  -122.128889, "NonEx"],
    ["Rain City", "Redmond", "Portal II", "Portal 2", 47.680447,  -122.131723, "NonEx"],
    ["Rain City", "Redmond", "The Last Test", "Last Test", 47.682691,  -122.132021, "NonEx"],
    ["Rain City", "Redmond", "Community Rockstars", "Community Rockstars", 47.683612,  -122.132734, "NonEx"],
    ["Rain City", "Redmond", "Redmond Twist", "Evergreen", 47.681979,  -122.123692, "NonEx"],
    ["Rain City", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378,  -122.122394, "NonEx"],
    ["Rain City", "Redmond", "Nike Park", "Nike Park", 47.683823,  -122.110841, "NonEx"],
    ["Rain City", "Redmond", "St. Jude Walking Trail", "St Judes", 47.693495,  -122.116883, "NonEx"],
    ["Rain City", "Redmond", "Redmond Meadow Park", "Meadow Park", 47.695703,  -122.126550, "NonEx"],
    ["Rain City", "Redmond", "Leaf Inlay in Sidewalk", "Leaf Inlay", 47.689362,  -122.114435, "NonEx"],
    ["Rain City", "Redmond", "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", "LDS (Hartman Park)", 47.690909,  -122.110964, "NonEx"],
    ["Rain City", "Redmond", "Hartman Park", "Hartman Park Sign", 47.691002,  -122.110177, "NonEx"],
    ["Rain City", "Redmond", "Jim Palmquist Memorial Plaque", "Hartman Park (Baseball)", 47.692436,  -122.107328, "NonEx"],
    ["Rain City", "Redmond", "Redmond Pool", "Redmond Pool", 47.692516,  -122.106308, "NonEx"],
    ["Rain City", "Redmond", "Bear Creek Water Tower", "Bear Creek Water Tower", 47.687974,  -122.103674, "NonEx"],
    ["Rain City", "Redmond", "Education Hill Pig", "Education Hill Pig", 47.674945,  -122.111546, "NonEx"],
    ["Bellevue", "Bellevue", "Find shiny deals at sprint", "Bellevue Sprint (fake)", 47.622703, -122.1625050, "NonEx"],
    ["Rain City", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
    ["Woodinville", "Woodinville", "Find shiny deals at Sprint", "Woodinville Sprint", 47.758248, 122.1537780, "ExEligible"],
];

const gymDirectory = GymDirectory.fromCsvData(gymSpecs);

let badGyms = [
    ["", "", "Gridlock Light Sculpture", "Gridlock", 47.673298, -122.125256, "NonEx"],
];

function getTestRaidManager(options) {
    options = options || { logger: null, strict: false, autosaveFile: null, refresh: 30 };
    let rm = new RaidManager(options);
    rm.setBossData(bosses);
    rm.setGymData(gymDirectory);
    return rm;
}

function getOffsetDate(offsetInMinutes) {
    return new Date(Date.now() + (offsetInMinutes * 60 * 1000));
}

var TestLogger = function () {
    this.output = [];
};

TestLogger.prototype.log = function (msg) {
    this.output.push(msg);
};

TestLogger.prototype.reset = function () {
    this.output = [];
};

var TestSearch = function () {
    this.contents = {};
};

TestSearch.prototype.search = function (str) {
    return this.contents[str];
};

describe("raidManager", () => {
    describe("setGymData method", () => {
        it("should accept valid gym data", () => {
            let rm = new RaidManager();
            rm.setGymData(gymDirectory);
            let expectGyms = gymSpecs.length;
            let gotGyms = rm.gyms.numGyms();
            expect(gotGyms).toBe(expectGyms);
        });

        it("should throw for invalid gym data", () => {
            let rm = new RaidManager();
            expect(() => rm.setGymData(badGyms)).toThrowError();
        });

        it("should throw if parameter is not an array and not a GymDirectory", () => {
            let rm = new RaidManager();
            expect(() => rm.setGymData({})).toThrowError(/expected gymdirectory or array/i);
        });

        it("should add a mapLink", () => {
            let rm = new RaidManager();
            let myGyms = [
                ["Rain City", "Redmond", "Cleveland Fountain", "Cleveland Fountain", 47.673667, -122.125595, "NonEx"],
            ];
            rm.setGymData(GymDirectory.fromCsvData(myGyms));
            let gym = rm.gyms.getAllGyms()[0];
            expect(gym.mapLink).toBeDefined();
        });

        it("should try to restore state", () => {
            let rm = new RaidManager();
            spyOn(rm, "tryRestoreState");
            rm.setGymData(gymDirectory);
            expect(rm.tryRestoreState).toHaveBeenCalled();
        });
    });

    describe("initGymDataAsync", () => {
        it("should load actual raid data", (done) => {
            let rm = new RaidManager();
            expect(rm.gyms).not.toBeDefined();
            rm.initGymDataAsync(fs.createReadStream(path.resolve("data/Gyms.csv"), "utf8"));
            setTimeout(() => {
                expect(rm.gyms).toBeDefined();
                done();
            }, 1000);
        });
    });

    describe("setBossData method", () => {
        it("should accept valid boss data", () => {
            let rm = new RaidManager();
            rm.setBossData(bosses);
            expect(rm.bosses.length).toBe(bosses.filter((b) => b.status !== "inactive").length);
        });

        it("should initialize the search object if no search is supplied", () => {
            let rm = new RaidManager();
            rm.setBossData(bosses);
            expect(rm.bossSearch).toBeDefined();
        });

        it("should use a prebuilt search object if supplied", () => {
            let searchObject = new TestSearch();
            let rm = new RaidManager();
            rm.setBossData(bosses, searchObject);
            expect(rm.bossSearch).toBe(searchObject);
        });

        it("should throw for invalid boss data", () => {
            let rm = new RaidManager();
            expect(() => rm.setBossData(badBosses)).toThrowError();
        });

        it("should try to restore state", () => {
            let rm = new RaidManager();
            spyOn(rm, "tryRestoreState");
            rm.setBossData(bosses);
            expect(rm.tryRestoreState).toHaveBeenCalled();
        });

        it("should respect boss active status", () => {
            let rm = new RaidManager();
            let numActive = 0;
            let numInactive = 0;

            rm.setBossData(bosses);
            bosses.forEach((b) => {
                if (b.status === "active") {
                    expect(rm.tryGetBoss(b.name)).toBeDefined();
                    numActive++;
                }
                else {
                    expect(rm.tryGetBoss(b.name)).toBeUndefined();
                    numInactive++;
                }
            });
            expect(numActive).toBeGreaterThan(0);
            expect(numInactive).toBeGreaterThan(0);
        });
    });

    describe("validateTier static method", () => {
        it("should accept numbers in range and well-formatted strings", () => {
            [
                [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], ["1", 1], ["2", 2], ["3", 3], ["4", 4], ["5", 5], ["Tier 1", 1], ["Tier 2", 2], ["Tier 3", 3], ["Tier 4", 4], ["Tier 5", 5],
            ].forEach((test) => {
                expect(RaidManager.validateTier(test[0])).toBe(test[1]);
            });
        });

        it("should default to tier 5 for undefined tier request", () => {
            expect(RaidManager.validateTier()).toBe(5);
        });

        it("should reject numbers out of range, poorly formatted strings, and objects", () => {
            [
                -1, 0, 6, "-100", "600", "Tier 7", "tier 1", "L1", "blah-di-blah", {}, /Tier 1/,
            ].forEach((v) => {
                expect(() => RaidManager.validateTier(v)).toThrow();
            });
        });
    });

    describe("validateHatchTime static method", () => {
        it("should accept valid times", () => {
            [1, 10, 59].forEach((minutes) => {
                let date = getOffsetDate(minutes);
                let time = new FlexTime(date);
                let validTime = RaidManager.validateHatchTime(time.toString());
                expect(validTime.getHours()).toBe(time.getHours());
                expect(validTime.getMinutes()).toBe(time.getMinutes());
            });
        });

        it("should reject invalid times", () => {
            [-2, 65].forEach((minutes) => {
                let date = getOffsetDate(minutes);
                let time = new FlexTime(date);
                expect(() => RaidManager.validateHatchTime(time.toString())).toThrow();
            });
        });
    });

    describe("validateEggTimer static method", () => {
        it("should accept valid numbers and strings in range", () => {
            [
                1, 10, 30, 45, 60, "15", "30", "50",
            ].forEach((v) => {
                expect(RaidManager.validateEggTimer(v)).toBe(Number(v));
            });
        });

        it("should reject out of range numbers/strings or anything other type", () => {
            [
                -15, 0, 61, 1000, "-5", "65", {}, /\d\d/,
            ].forEach((v) => {
                expect(() => RaidManager.validateEggTimer(v)).toThrow();
            });
        });
    });

    describe("validateRaidTimer static method", () => {
        it("should accept valid numbers and strings in range", () => {
            [
                1, 10, 30, 45, "15", "30", "40",
            ].forEach((v) => {
                expect(RaidManager.validateRaidTimer(v)).toBe(Number(v));
            });
        });

        it("should reject out of range numbers/strings or anything other type", () => {
            [
                -15, 0, 46, 1000, "-1", "60", {}, /\d\d/,
            ].forEach((v) => {
                expect(() => RaidManager.validateRaidTimer(v)).toThrow();
            });
        });
    });

    describe("validateBoss method", () => {
        it("should throw an appropriate error if bosses aren't initialized", () => {
            let rm = new RaidManager();
            rm.setGymData(gymDirectory);
            expect(() => rm.validateBoss("ttar")).toThrowError("RaidManager not ready - bosses not initialized.");
        });

        it("should match a valid boss", () => {
            let rm = getTestRaidManager();
            [
                ["latias", "Latias"],
                ["ho-oh", "Ho-oh"],
                ["ttar", "Tyranitar"],
                ["hooh", "Ho-oh"],
            ].forEach((test) => {
                let boss = rm.validateBoss(test[0]);
                expect(boss.name).toBe(test[1]);
            });
        });

        it("should throw for an invalid boss", () => {
            let rm = getTestRaidManager();
            ["BOGOBOSS", "WTF"].forEach((bossName) => {
                expect(() => rm.validateBoss(bossName)).toThrow();
            });
        });

        it("should use a valid boss object if supplied", () => {
            let rm = getTestRaidManager();
            let boss = rm.validateBoss(bosses[3]);
            expect(boss).toBe(bosses[3]);
        });

        it("should throw if an invalid boss object is supplied", () => {
            let rm = getTestRaidManager();
            expect(() => rm.validateBoss(badBosses[0])).toThrowError();
        });
    });

    describe("tryGetBoss method", () => {
        it("should throw an appropriate error if bosses aren't initialized", () => {
            let rm = new RaidManager();
            rm.setGymData(gymDirectory);
            expect(() => rm.tryGetBoss("ttar")).toThrowError("RaidManager not ready - bosses not initialized.");
        });

        it("should match a valid boss", () => {
            let rm = getTestRaidManager();
            [
                ["latias", "Latias"],
                ["ho-oh", "Ho-oh"],
                ["ttar", "Tyranitar"],
                ["hooh", "Ho-oh"],
            ].forEach((test) => {
                let boss = rm.tryGetBoss(test[0]);
                expect(boss.name).toBe(test[1]);
            });
        });

        it("should return undefined for an invalid boss", () => {
            let rm = getTestRaidManager();
            ["BOGOBOSS", "WTF"].forEach((bossName) => {
                expect(rm.tryGetBoss(bossName)).toBeUndefined();
            });
        });

        it("should throw if an object is supplied", () => {
            let rm = getTestRaidManager();
            expect(() => rm.tryGetBoss(bosses[3])).toThrowError("Must use boss name for tryGetBoss.");
        });
    });

    describe("validateGym method", () => {
        it("should throw an appropriate error if gyms aren't initialized", () => {
            let rm = new RaidManager();
            rm.setBossData(bosses);
            expect(() => rm.validateGym("luke")).toThrowError("RaidManager not ready - gyms not initialized.");
        });

        it("should match a valid gym", () => {
            let rm = getTestRaidManager();
            [
                ["painted", "Painted Parking Lot"],
                ["market", "Redmond Town Center Fish Statue"],
                ["pd", "Weiner Elephants"],
                ["city hall", "Hunting Fox"],
            ].forEach((test) => {
                let gym = rm.validateGym(test[0]);
                expect(gym.officialName).toBe(test[1]);
            });
        });

        it("should throw for an invalid gym", () => {
            let rm = getTestRaidManager();
            ["BOGOGYM", "WTF"].forEach((gymName) => {
                expect(() => rm.validateGym(gymName)).toThrow();
            });
        });

        it("should use a valid gym object if supplied", () => {
            let rm = getTestRaidManager();
            let originalGym = gymDirectory.getAllGyms()[3];
            let gym = rm.validateGym(originalGym);
            expect(gym).toBe(originalGym);
        });

        it("should throw if an invalid gym object is supplied", () => {
            let rm = getTestRaidManager();
            expect(() => rm.validateGym(badGyms[0])).toThrowError();
        });
    });

    describe("tryGetGym method", () => {
        it("should throw an appropriate error if gyms aren't initialized", () => {
            let rm = new RaidManager();
            rm.setBossData(bosses);
            expect(() => rm.tryGetGym("market")).toThrowError("RaidManager not ready - gyms not initialized.");
        });

        it("should match a valid gym", () => {
            let rm = getTestRaidManager();
            [
                ["painted", "Painted Parking Lot"],
                ["market", "Redmond Town Center Fish Statue"],
                ["pd", "Weiner Elephants"],
                ["city hall", "Hunting Fox"],
            ].forEach((test) => {
                let gym = rm.tryGetGym(test[0]);
                expect(gym.officialName).toBe(test[1]);
            });
        });

        it("should return undefined for an invalid gym", () => {
            let rm = getTestRaidManager();
            ["XYZZY", "WTF"].forEach((gymName) => {
                expect(rm.tryGetGym(gymName)).toBeUndefined();
            });
        });

        it("should throw if an object is supplied", () => {
            let rm = getTestRaidManager();
            expect(() => rm.tryGetGym(gymSpecs[3])).toThrowError("Must use gym name for tryGetGym.");
        });
    });

    describe("tryGetRaid method", () => {
        it("should throw an appropriate error if gyms aren't initialized", () => {
            let rm = new RaidManager();
            rm.setBossData(bosses);
            expect(() => rm.tryGetRaid("market")).toThrowError("RaidManager not ready - gyms not initialized.");
        });

        it("should return a raid or undefined for any valid gym", () => {
            let rm = getTestRaidManager();
            rm.addRaid("ttar", "painted", 20);
            rm.addEggCountdown(5, "elephants", 20);

            [
                ["Painted Parking Lot", "Painted Parking Lot", true],
                ["market", "Redmond Town Center Fish Statue", false],
                ["redmond pd", "Weiner Elephants", true],
                ["city hall", "Hunting Fox", false],
            ].forEach((test) => {
                let raid = rm.tryGetRaid(test[0]);
                if (test[2]) {
                    expect(raid).toBeDefined();
                    expect(raid.gym.officialName).toBe(test[1]);
                }
                else {
                    expect(raid).toBeUndefined();
                }
            });
        });

        it("should return undefined for an invalid gym", () => {
            let rm = getTestRaidManager();
            ["XYZZY", "WTF"].forEach((gymName) => {
                expect(rm.tryGetRaid(gymName)).toBeUndefined();
            });
        });

        it("should throw if an object is supplied", () => {
            let rm = getTestRaidManager();
            expect(() => rm.tryGetRaid(gymSpecs[3])).toThrowError("Must use gym name for tryGetRaid.");
        });
    });

    describe("_forceRaid test helper method", () => {
        it("should return undefined if no gym is specified", () => {
            let rm = getTestRaidManager();
            expect(rm._forceRaid(undefined, 5, undefined, new Date())).toBeUndefined();
        });

        it("should use a gym object if supplied", () => {
            let rm = getTestRaidManager();
            let gym = rm.validateGym("painted");
            let raid = rm._forceRaid(gym, 5, undefined, new Date());
            expect(raid.gym).toBe(gym);
        });

        it("should accept a time string", () => {
            let rm = getTestRaidManager();
            let farFutureRaidTime = FlexTime.getFlexTime(Date.now(), 365);
            let raid = rm._forceRaid("market", 5, undefined, farFutureRaidTime.toString());
            expect(raid.hatchTime).toBeGreaterThan(new Date());
        });

        it("should accept bad data", () => {
            let rm = getTestRaidManager();
            rm._forceRaid("market", 5, undefined, "0110", 117);
            expect(() => rm.listFormatted()).toThrowError("Internal error: unexpected raid state 117");
        });

        it("should preserve raiders when updating a raid", () => {
            let raiderInfo = {
                raiderName: "Test Raider",
                gym: undefined,
                etaTime: undefined,
                arrivalTime: undefined,
                startTime: undefined,
                endTime: undefined,
                code: undefined,
            };
            let rm = getTestRaidManager();
            let raid = rm._forceRaid("painted", 5, undefined, new Date());
            expect(raid.raiders["Test Raider"]).toBeUndefined();
            rm.addOrUpdateRaider("painted", raiderInfo);
            raid = rm.tryGetRaid("painted");
            expect(raid.raiders["Test Raider"]).toBeDefined();

            rm._forceRaid("painted", 4, undefined, new Date());
            raid = rm.tryGetRaid("painted");
            expect(raid.tier).toBe(4);
            expect(raid.raiders["Test Raider"]).toBeDefined();
        });

        it("should not report a raids update", () => {
            let rm = getTestRaidManager();
            spyOn(rm, "reportRaidsUpdate");

            let farFutureRaidTime = FlexTime.getFlexTime(Date.now(), 365);
            rm._forceRaid("market", 5, undefined, farFutureRaidTime.toString());
            expect(rm.reportRaidsUpdate).not.toHaveBeenCalled();
        });
    });

    describe("addRaid method", () => {
        it("should add a raid with valid gym, boss and time remaining even if a raid is already reported for the location", () => {
            let rm = getTestRaidManager();
            [
                ["hooh", "painted", 20, "Painted Parking Lot", "Ho-oh", 5],
                ["latias", "city hall", 1, "Hunting Fox", "Latias", 5],
                ["ttar", "painted", 44, "Painted Parking Lot", "Tyranitar", 4],
            ].forEach((test) => {
                let raid = rm.addRaid(test[0], test[1], test[2]);

                let now = new FlexTime();
                let expiry = FlexTime.getFlexTime(now, test[2]);
                let hatch = FlexTime.getFlexTime(expiry, -RaidManager.maxRaidActiveTime);
                let spawn = FlexTime.getFlexTime(hatch, -RaidManager.maxEggHatchTime);

                expect(raid.spawnTime.getHours()).toEqual(spawn.getHours());
                expect(raid.spawnTime.getMinutes()).toEqual(spawn.getMinutes());
                expect(raid.hatchTime.getHours()).toEqual(hatch.getHours());
                expect(raid.hatchTime.getMinutes()).toEqual(hatch.getMinutes());
                expect(raid.expiryTime.getHours()).toEqual(expiry.getHours());
                expect(raid.expiryTime.getMinutes()).toEqual(expiry.getMinutes());

                expect(raid.state).toBe(RaidManager.RaidStateEnum.hatched);
                expect(raid.gym.officialName).toBe(test[3]);
                expect(raid.pokemon.name).toBe(test[4]);
                expect(raid.tier).toBe(test[5]);
            });
        });

        it("should fail for an invalid boss, gym, or time remaining", function () {
            let rm = getTestRaidManager();
            [
                ["BLARG", "painted", 20, "No known boss matches requested name \"BLARG\"."],
                ["latias", "XYZZY", 1, "No known gym matches requested name \"XYZZY\"."],
                ["latias", "painted", 0, "Raid timer 0 is out of range (1..45)."],
                ["latias", "painted", -15, "Raid timer -15 is out of range (1..45)."],
                ["latias", "painted", 65, "Raid timer 65 is out of range (1..45)."],
            ].forEach((test) => {
                expect(() => {
                    rm.addRaid(test[0], test[1], test[2]);
                }).toThrowError(test[3]);
            });
        });

        it("should log the added raid", () => {
            let logger = new TestLogger();
            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: null });
            rm.addRaid("ttar", "wells", 20);
            expect(logger.output.length).toBe(1);
            expect(logger.output[0]).toMatch(/.*Active Raid Added.*/i);
        });

        it("should report a raids update", () => {
            let rm = getTestRaidManager();
            spyOn(rm, "reportRaidsUpdate");

            rm.addRaid("ttar", "wells", 20);
            expect(rm.reportRaidsUpdate).toHaveBeenCalled();
        });

        it("should update any raid channels", () => {
            let calls = 0;
            let rm = getTestRaidManager();
            rm.addRaidChannel({ update: function () { calls++; } });

            rm.addRaid("ttar", "wells", 20);
            expect(calls).toBe(1);
        });

        describe("in strict mode", () => {
            it("should throw if a different raid is already reported for the location", () => {
                let rm = getTestRaidManager({ logger: null, strict: true, autosaveFile: null });
                rm.addRaid("hooh", "painted", 20);
                expect(() => rm.addRaid("latias", "painted", 40)).toThrowError(/^.*Raid.*already has.*boss.*$/);
                expect(() => rm.addRaid("hooh", "painted", 40)).toThrowError(/^New end time.*too far from existing.*$/);
                expect(() => rm.addRaid("hooh", "painted", 10)).toThrowError(/^New end time.*too far from existing.*$/);
            });

            it("should adjust the end time of an existing raid within tolerance if other details match", () => {
                let rm = getTestRaidManager({ logger: null, strict: true, autosaveFile: null });
                let originalExpiry = rm.addRaid("hooh", "painted", 20).expiryTime;
                let newRaid = rm.addRaid("hooh", "painted", 22);
                expect(newRaid.expiryTime).toBeGreaterThan(originalExpiry);

                newRaid = rm.addRaid("hooh", "painted", 18);
                expect(newRaid.expiryTime).toBeLessThan(originalExpiry);
            });

            it("should add a boss to an undefined raid of the same tier, adjusting time within tolerance", () => {
                let rm = getTestRaidManager({ logger: null, strict: true, autosaveFile: null });
                let hatch = getOffsetDate(-25); // 20 left
                let originalExpiry = rm._forceRaid("painted", 5, undefined, hatch).expiryTime;
                let newRaid = rm.addRaid("hooh", "painted", 22);
                expect(newRaid.expiryTime).toBeGreaterThan(originalExpiry);
                expect(newRaid.pokemon.name).toBe("Ho-oh");
            });

            it("should throw for an undefined raid if tier does not match or if time is out of tolerance", () => {
                let rm = getTestRaidManager({ logger: null, strict: true, autosaveFile: null });
                let hatch = getOffsetDate(-25); // 20 left
                rm._forceRaid("painted", 5, undefined, hatch);
                expect(() => rm.addRaid("ttar", "painted", 20)).toThrowError(/Cannot add.*existing tier 5.*$/);
                expect(() => rm.addRaid("latias", "painted", 10)).toThrowError(/New end time.*too far from existing.*$/);
                expect(() => rm.addRaid("hooh", "painted", 40)).toThrowError(/New end time.*too far from existing.*$/);
            });
        });
    });

    describe("setRaidBoss method", () => {
        it("should add a boss to an existing raid with no boss, regardless of tier", () => {
            let rm = getTestRaidManager();
            let hatch = getOffsetDate(-5);
            let raid = rm._forceRaid("painted", 5, undefined, hatch);

            expect(raid).toBeDefined();

            let bossRaid = rm.setRaidBoss("ttar", "painted");
            expect(bossRaid).toBeDefined();
            expect(bossRaid.pokemon.name).toBe("Tyranitar");
        });

        it("should replace the boss of an existing raid with a boss, regardless of tier", () => {
            let rm = getTestRaidManager();
            let hatch = getOffsetDate(-5);
            let raid = rm._forceRaid("painted", 5, "latias", hatch);

            expect(raid).toBeDefined();

            let bossRaid = rm.setRaidBoss("ttar", "painted");
            expect(bossRaid).toBeDefined();
            expect(bossRaid.pokemon.name).toBe("Tyranitar");
        });

        it("should fail if no raid exists", () => {
            let rm = getTestRaidManager();
            expect(() => rm.setRaidBoss("ttar", "painted")).toThrowError("Cannot set raid boss of unreported raids. Please add the raid.");
        });

        it("should fail if an unknown boss or gym is supplied", () => {
            let rm = getTestRaidManager();
            expect(() => rm.setRaidBoss("XYZZY", "painted")).toThrowError("No known boss matches requested name \"XYZZY\".");
            expect(() => rm.setRaidBoss("ttar", "XYZZY")).toThrowError("No known gym matches requested name \"XYZZY\".");
        });

        it("should throw if the egg has not hached yet", () => {
            let rm = getTestRaidManager();
            rm.addEggCountdown(5, "market", 10);
            expect(() => rm.setRaidBoss("hooh", "market")).toThrowError("Cannot set raid boss for unhatched egg.  Please update the raid time.");
        });

        it("should log the updated raid", () => {
            let logger = new TestLogger();
            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: null });
            rm._forceRaid("painted", 5, undefined, getOffsetDate(-5));
            expect(logger.output.length).toBe(0);
            rm.setRaidBoss("hooh", "painted");
            expect(logger.output.length).toBe(1);
            expect(logger.output[0]).toMatch(/.*Updated boss for raid.*/i);
        });

        it("should report a raids update", () => {
            let rm = getTestRaidManager();
            spyOn(rm, "reportRaidsUpdate");
            rm._forceRaid("painted", 5, undefined, getOffsetDate(-5));
            expect(rm.reportRaidsUpdate).not.toHaveBeenCalled();
            rm.setRaidBoss("latias", "painted");
            expect(rm.reportRaidsUpdate).toHaveBeenCalled();
        });

        describe("in strict mode", () => {
            it("should succeed if the egg is hatched, boss is unknown and new boss is of the right tier", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                let hatch = getOffsetDate(-10);
                rm._forceRaid("wells", 5, undefined, hatch, RaidManager.RaidStateEnum.hatched);
                let raid = rm.setRaidBoss("hooh", "wells");
                expect(raid.pokemon.name).toBe("Ho-oh");
                expect(raid.hatchTime).toBe(hatch);
            });

            it("should throw if the raid already has a different boss", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                rm.addRaid("hooh", "luke", 30);
                expect(() => rm.setRaidBoss("latias", "luke")).toThrowError(/Raid.*already has.*boss.*/);
            });

            it("should succeed if the raid already has the same boss", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                rm.addRaid("hooh", "luke", 30);
                expect(() => rm.setRaidBoss("hooh", "luke")).not.toThrowError();
            });

            it("should throw if boss is of the wrong tier", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                let hatch = getOffsetDate(-10);
                rm._forceRaid("wells", 5, undefined, hatch, RaidManager.RaidStateEnum.hatched);
                expect(() => rm.setRaidBoss("ttar", "wells")).toThrowError(/Cannot set.*as boss for a tier.*raid/);
            });
        });
    });

    describe("addEggCountdown method", () => {
        it("should add a valid egg when no raid exists at the location", () => {
            let rm = getTestRaidManager();
            let raid = rm.addEggCountdown(5, "painted", 10);
            let hatch = FlexTime.getFlexTime(Date.now(), 10);
            let spawn = FlexTime.getFlexTime(hatch, -RaidManager.maxEggHatchTime);
            let expiry = FlexTime.getFlexTime(hatch, RaidManager.maxRaidActiveTime);

            expect(raid.tier).toBe(5);
            expect(raid.pokemon).toBeUndefined();
            expect(raid.state).toBe(RaidManager.RaidStateEnum.egg);
            expect(raid.spawnTime.getHours()).toBe(spawn.getHours());
            expect(raid.spawnTime.getMinutes()).toBe(spawn.getMinutes());
            expect(raid.hatchTime.getHours()).toBe(hatch.getHours());
            expect(raid.hatchTime.getMinutes()).toBe(hatch.getMinutes());
            expect(raid.expiryTime.getHours()).toBe(expiry.getHours());
            expect(raid.expiryTime.getMinutes()).toBe(expiry.getMinutes());
        });

        it("should add a valid egg when a raid already exists at the location", () => {
            let rm = getTestRaidManager();
            expect(rm.addRaid("latias", "market", 30)).toBeDefined();

            let raid = rm.addEggCountdown(4, "market", 20);
            let hatch = FlexTime.getFlexTime(Date.now(), 20);
            let spawn = FlexTime.getFlexTime(hatch, -RaidManager.maxEggHatchTime);
            let expiry = FlexTime.getFlexTime(hatch, RaidManager.maxRaidActiveTime);
            expect(raid.tier).toBe(4);
            expect(raid.pokemon).toBeUndefined();
            expect(raid.state).toBe(RaidManager.RaidStateEnum.egg);
            expect(raid.spawnTime.getHours()).toBe(spawn.getHours());
            expect(raid.spawnTime.getMinutes()).toBe(spawn.getMinutes());
            expect(raid.hatchTime.getHours()).toBe(hatch.getHours());
            expect(raid.hatchTime.getMinutes()).toBe(hatch.getMinutes());
            expect(raid.expiryTime.getHours()).toBe(expiry.getHours());
            expect(raid.expiryTime.getMinutes()).toBe(expiry.getMinutes());
        });

        it("should throw for an invalid tier, location or timer", () => {
            let rm = getTestRaidManager();
            expect(() => rm.addEggCountdown(-1, "painted", 10)).toThrowError("Tier value -1 must be in the range 1-5.");
            expect(() => rm.addEggCountdown(0, "painted", 10)).toThrowError("Tier value 0 must be in the range 1-5.");
            expect(() => rm.addEggCountdown(6, "painted", 10)).toThrowError("Tier value 6 must be in the range 1-5.");
            expect(() => rm.addEggCountdown(5, "XYZZY", 10)).toThrowError("No known gym matches requested name \"XYZZY\".");
            expect(() => rm.addEggCountdown(5, "painted", 0)).toThrowError("Egg timer 0 is out of range (1..60).");
            expect(() => rm.addEggCountdown(5, "painted", -15)).toThrowError("Egg timer -15 is out of range (1..60).");
            expect(() => rm.addEggCountdown(5, "painted", 75)).toThrowError("Egg timer 75 is out of range (1..60).");
        });

        it("should log the added raid", () => {
            let logger = new TestLogger();
            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: null });
            logger.reset();
            rm.addEggCountdown(5, "wells", 20);
            expect(logger.output.length).toBe(1);
            expect(logger.output[0]).toMatch(/.*Raid egg added with relative time.*/i);
        });

        it("should report a raids update", () => {
            let rm = getTestRaidManager();
            spyOn(rm, "reportRaidsUpdate");
            rm.addEggCountdown(5, "market", 20);
            expect(rm.reportRaidsUpdate).toHaveBeenCalled();
        });

        describe("in strict mode", () => {
            it("should succeed if existing raid has matching tier and expiry within tolerance", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                let originalExpiry = rm.addEggCountdown(5, "erratic", 20).expiryTime;
                let newExpiry = rm.addEggCountdown(5, "erratic", 22).expiryTime;

                expect(newExpiry).toBeGreaterThan(originalExpiry);

                newExpiry = rm.addEggCountdown(5, "erratic", 18).expiryTime;
                expect(newExpiry).toBeLessThan(originalExpiry);
            });

            it("should throw if the raid already has a boss", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                rm.addRaid("hooh", "luke", 30);
                expect(() => rm.addEggCountdown(5, "luke", 20)).toThrowError(/Cannot replace existing Ho-oh.*/);
            });

            it("should throw if an existing egg has a different tier", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                rm.addEggCountdown(4, "ironcycle", 20);
                expect(() => rm.addEggCountdown(5, "ironcycle", 20)).toThrowError(/Cannot replace existing tier 4.*/);
            });

            it("should throw if the new timer is too far from the existing one", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                rm.addEggCountdown(4, "ironcycle", 20);
                expect(() => rm.addEggCountdown(4, "ironcycle", 40)).toThrowError(/New end time.*too far from existing end.*/);
            });
        });
    });

    describe("addEggAbsolute method", () => {
        it("should add a valid egg when no raid exists at the location", () => {
            let rm = getTestRaidManager();
            let hatch = FlexTime.getFlexTime(Date.now(), 10);
            let spawn = FlexTime.getFlexTime(hatch, -RaidManager.maxEggHatchTime);
            let expiry = FlexTime.getFlexTime(hatch, RaidManager.maxRaidActiveTime);

            let raid = rm.addEggAbsolute(5, "painted", hatch.toString());
            expect(raid.tier).toBe(5);
            expect(raid.pokemon).toBeUndefined();
            expect(raid.state).toBe(RaidManager.RaidStateEnum.egg);
            expect(raid.spawnTime.getHours()).toBe(spawn.getHours());
            expect(raid.spawnTime.getMinutes()).toBe(spawn.getMinutes());
            expect(raid.hatchTime.getHours()).toBe(hatch.getHours());
            expect(raid.hatchTime.getMinutes()).toBe(hatch.getMinutes());
            expect(raid.expiryTime.getHours()).toBe(expiry.getHours());
            expect(raid.expiryTime.getMinutes()).toBe(expiry.getMinutes());
        });

        it("should add a valid egg when a raid already exists at the location", () => {
            let rm = getTestRaidManager();
            expect(rm.addRaid("latias", "market", 30)).toBeDefined();

            let hatch = FlexTime.getFlexTime(Date.now(), 20);
            let spawn = FlexTime.getFlexTime(hatch, -RaidManager.maxEggHatchTime);
            let expiry = FlexTime.getFlexTime(hatch, RaidManager.maxRaidActiveTime);

            let raid = rm.addEggAbsolute(4, "market", hatch.toString());
            expect(raid.tier).toBe(4);
            expect(raid.pokemon).toBeUndefined();
            expect(raid.state).toBe(RaidManager.RaidStateEnum.egg);
            expect(raid.spawnTime.getHours()).toBe(spawn.getHours());
            expect(raid.spawnTime.getMinutes()).toBe(spawn.getMinutes());
            expect(raid.hatchTime.getHours()).toBe(hatch.getHours());
            expect(raid.hatchTime.getMinutes()).toBe(hatch.getMinutes());
            expect(raid.expiryTime.getHours()).toBe(expiry.getHours());
            expect(raid.expiryTime.getMinutes()).toBe(expiry.getMinutes());
        });

        it("should throw for an invalid tier, location or start time", () => {
            let rm = getTestRaidManager();
            let validHatch = FlexTime.getFlexTime(Date.now(), 20).toString();

            expect(() => rm.addEggAbsolute(-1, "painted", validHatch)).toThrowError("Tier value -1 must be in the range 1-5.");
            expect(() => rm.addEggAbsolute(0, "painted", validHatch)).toThrowError("Tier value 0 must be in the range 1-5.");
            expect(() => rm.addEggAbsolute(6, "painted", validHatch)).toThrowError("Tier value 6 must be in the range 1-5.");
            expect(() => rm.addEggAbsolute(5, "XYZZY", validHatch)).toThrowError("No known gym matches requested name \"XYZZY\".");

            [-10, 75, 11 * 60].forEach((delta) => {
                let time = FlexTime.getFlexTime(Date.now(), delta).toString();
                let expected = (delta < 0) ? /Requested hatch time .* is in the past/ : /Requested hatch time .* is too far in the future/;
                expect(() => rm.addEggAbsolute(5, "painted", time)).toThrowError(expected);
            });
        });

        it("should log the added raid", () => {
            let logger = new TestLogger();
            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: null });
            let validHatch = FlexTime.getFlexTime(Date.now(), 20).toString();

            rm.addEggAbsolute(5, "wells", validHatch);
            expect(logger.output.length).toBe(1);
            expect(logger.output[0]).toMatch(/.*Raid egg added with absolute time.*/i);
        });

        it("should report a raids update", () => {
            let rm = getTestRaidManager();
            spyOn(rm, "reportRaidsUpdate");
            rm.addEggAbsolute(5, "market", getOffsetDate(10));
            expect(rm.reportRaidsUpdate).toHaveBeenCalled();
        });

        describe("in strict mode", () => {
            it("should succeed if existing raid has matching tier and expiry is within tolerance", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                let originalHatch = getOffsetDate(20);
                let laterHatch = getOffsetDate(22);
                let earlierHatch = getOffsetDate(18);

                let originalRaid = rm.addEggAbsolute(5, "erratic", originalHatch);
                expect(originalRaid.hatchTime).toBe(originalHatch);

                let laterRaid = rm.addEggAbsolute(5, "erratic", laterHatch);
                expect(laterRaid.hatchTime).toBe(laterHatch);

                let earlierRaid = rm.addEggAbsolute(5, "erratic", earlierHatch);
                expect(earlierRaid.hatchTime).toBe(earlierHatch);
            });

            it("should throw if the raid already has a boss", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                rm.addRaid("hooh", "luke", 30);
                let hatch = getOffsetDate(30);
                expect(() => rm.addEggAbsolute(5, "luke", hatch)).toThrowError(/Cannot replace existing Ho-oh.*/);
            });

            it("should throw if an existing egg has a different tier", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                rm.addEggCountdown(4, "ironcycle", 20);
                let hatch = getOffsetDate(20);
                expect(() => rm.addEggAbsolute(5, "ironcycle", hatch)).toThrowError(/Cannot replace existing tier 4.*/);
            });

            it("should throw if the new timer is too far from the existing one", () => {
                let rm = getTestRaidManager({ strict: true, logger: null, autosaveFile: null });
                rm.addEggCountdown(4, "ironcycle", 20);
                let hatch = getOffsetDate(40);
                expect(() => rm.addEggAbsolute(4, "ironcycle", hatch)).toThrowError(/New end time.*too far from existing end.*/);
            });
        });
    });

    describe("removeRaid method", () => {
        it("should remove an existing raid", () => {
            let rm = getTestRaidManager();
            expect(rm.addEggCountdown(5, "painted", 20)).toBeDefined();

            expect(rm.tryGetRaid("painted")).toBeDefined();
            expect(rm.removeRaid("painted")).toBeDefined();
            expect(rm.tryGetRaid("painted")).toBeUndefined();
        });

        it("should throw if no raid exists", () => {
            let rm = getTestRaidManager();
            expect(() => rm.removeRaid("painted")).toThrowError("No raid reported at Painted Parking Lot.");
        });

        it("should log the added raid", () => {
            let logger = new TestLogger();
            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: null });

            expect(rm._forceRaid("painted", 5, undefined, getOffsetDate(20))).toBeDefined();
            expect(logger.output.length).toBe(0);
            expect(rm.removeRaid("painted")).toBeDefined();
            expect(logger.output.length).toBe(1);
            expect(logger.output[0]).toMatch(/.*Raid removed.*/i);
        });

        it("should report a raids update", () => {
            let rm = getTestRaidManager();
            rm._forceRaid("erratic", 5, undefined, getOffsetDate(10));

            spyOn(rm, "reportRaidsUpdate");
            expect(rm.removeRaid("erratic")).toBeDefined();
            expect(rm.reportRaidsUpdate).toHaveBeenCalled();
        });
    });

    describe("addRaider method", () => {
        it("should add a new raider", () => {
            let rm = getTestRaidManager();
            rm.addRaid("kyogre", "painted", 20);
            expect(rm.tryGetRaider("painted", "jasmine")).toBeUndefined();
            rm.addOrUpdateRaider("painted", { raiderName: "jasmine" });
            expect(rm.tryGetRaider("painted", "jasmine")).toBeDefined();
        });

        it("should update an existing raider", () => {
            let rm = getTestRaidManager();
            rm.addRaid("kyogre", "painted", 20);
            expect(rm.tryGetRaider("painted", "jasmine")).toBeUndefined();
            rm.addOrUpdateRaider("painted", { raiderName: "jasmine" });
            let raider = rm.tryGetRaider("painted", "jasmine");
            expect(raider).toBeDefined();
            expect(raider.etaTime).toBeUndefined();
            rm.addOrUpdateRaider("painted", { raiderName: "jasmine", etaTime: "10" });
            raider = rm.tryGetRaider("painted", "jasmine");
            expect(raider).toBeDefined();
            expect(raider.etaTime).toBeDefined();
            expect(raider.etaTime.getTime()).toBeGreaterThan(Date.now());
        });

        it("should throw if there is no raid reported for the requested gym", () => {
            let rm = getTestRaidManager();
            expect(() => rm.addOrUpdateRaider("painted", { raiderName: "jasmine" })).toThrowError(/no raid reported/i);
        });
    });

    describe("tryGetRaider method", () => {
        it("should throw if there is no raid reported for the requested gym", () => {
            let rm = getTestRaidManager();
            expect(() => rm.tryGetRaider("painted", "jasmine")).toThrowError(/no raid reported/i);
        });
    });

    describe("removeRaider method", () => {
        it("should succeed if the raider has rsvp'ed", () => {
            let rm = getTestRaidManager();
            rm.addRaid("kyogre", "painted", 20);
            expect(rm.tryGetRaider("painted", "jasmine")).toBeUndefined();
            rm.addOrUpdateRaider("painted", { raiderName: "jasmine" });
            expect(rm.tryGetRaider("painted", "jasmine")).toBeDefined();
            expect(() => rm.removeRaider("painted", "jasmine")).not.toThrow();
        });

        it("should throw if there is no raid reported for the requested gym", () => {
            let rm = getTestRaidManager();
            expect(() => rm.removeRaider("painted", "jasmine")).toThrowError(/no raid reported/i);
        });

        it("should throw if the raider has not rsvp'ed for the raid at the specified gym", () => {
            let rm = getTestRaidManager();
            rm.addRaid("kyogre", "painted", 20);
            expect(rm.tryGetRaider("painted", "jasmine")).toBeUndefined();
            expect(() => rm.removeRaider("painted", "jasmine")).toThrowError(/has not rsvp'ed/i);
        });
    });

    describe("list method", () => {
        it("should list raids in time order", () => {
            let rm = getTestRaidManager();
            expect(rm.addEggCountdown(5, "painted", 30)).toBeDefined();
            expect(rm.addEggCountdown(5, "market", 20)).toBeDefined();
            expect(rm.addEggCountdown(4, "luke", 10)).toBeDefined();
            expect(rm.addRaid("ttar", "wells", 30));

            let last = undefined;
            let list = rm.list();
            list.forEach((raid) => {
                if (last) {
                    expect(raid.expiryTime.getTime()).toBeGreaterThan(last.expiryTime.getTime());
                }
                last = raid;
            });
        });
    });

    describe("listFormatted method", () => {
        it("should list raids in time order", () => {
            let rm = getTestRaidManager();
            expect(rm.addEggCountdown(5, "painted", 30)).toBeDefined();
            expect(rm.addEggCountdown(4, "luke", 10)).toBeDefined();
            expect(rm.addEggCountdown(3, "soul foods", 20)).toBeDefined();
            expect(rm.addEggCountdown(2, "victors", 15)).toBeDefined();
            expect(rm.addEggCountdown(1, "clock tower", 25)).toBeDefined();
            expect(rm.addRaid("hooh", "wells", 10));
            expect(rm.addRaid("ttar", "city hall", 40));
            expect(rm.addRaid("machamp", "wisdom seekers", 30));
            expect(rm.addRaid("sableeye", "erratic", 25));
            expect(rm.addRaid("magickarp", "ben franklin", 15));

            let expected = [
                /^.*ACTIVE RAIDS.*$/,
                /^.*Ho-oh.*Wells Fargo.*ends @.*$/,
                /^.*Magikarp.*Ironcycle.*ends @.*$/,
                /^.*Sableye.*Erratic.*ends @.*$/,
                /^.*Machamp.*Wisdom Seekers.*ends @.*$/,
                /^.*Tyranitar.*Hunting Fox.*ends @.*$/,
                /^.*$/,
                /^.*UPCOMING RAIDS.*$/,
                /^.*T.*4.+Beavers @.*$/,
                /^.*T.*2.+Roasters @.*$/,
                /^.*T.*3.+Soulfood.*Cafe @.*$/,
                /^.*T.*1.+Clock Tower @.*$/,
                /^.*T.*5.+Parking Lot @.*$/,
            ];

            [
                {
                    min: 1,
                    max: 5,
                    expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                },
                {
                    min: 4,
                    max: 5,
                    expected: [0, 1, 5, 6, 7, 8, 12],
                },
                {
                    min: 3,
                    max: 3,
                    expected: [0, 4, 6, 7, 10],
                },
                {
                    min: 2,
                    max: 3,
                    expected: [0, 3, 4, 6, 7, 9, 10],
                },
            ].forEach((test) => {
                let output = rm.listFormatted((r) => (r.tier >= test.min) && (r.tier <= test.max));
                let lines = output.split("\n");
                test.expected.forEach((index) => {
                    let regex = expected[index];
                    let line = lines.shift();
                    // console.log(`${line}.match(${regex}) = ${regex.test(line)}`);
                    expect(line).toMatch(regex);
                });
            });
        });

        it("should list when only upcoming raids exist", () => {
            let rm = getTestRaidManager();
            expect(rm.addEggCountdown(5, "painted", 30)).toBeDefined();
            expect(rm.addEggCountdown(4, "luke", 10)).toBeDefined();
            expect(rm.addEggCountdown(3, "soul foods", 20)).toBeDefined();
            expect(rm.addEggCountdown(2, "victors", 15)).toBeDefined();
            expect(rm.addEggCountdown(1, "clock tower", 25)).toBeDefined();

            let expected = [
                /^.*UPCOMING RAIDS.*$/,
                /^.*T.*4.+Beavers @.*$/,
                /^.*T.*2.+Roasters @.*$/,
                /^.*T.*3.+Soulfood.*Cafe @.*$/,
                /^.*T.*1.+Clock Tower @.*$/,
                /^.*T.*5.+Parking Lot @.*$/,
            ];

            [
                {
                    min: 1,
                    max: 5,
                    expected: [0, 1, 2, 3, 4, 5],
                },
                {
                    min: 4,
                    max: 5,
                    expected: [0, 1, 5],
                },
                {
                    min: 3,
                    max: 3,
                    expected: [0, 3],
                },
                {
                    min: 2,
                    max: 3,
                    expected: [0, 2, 3],
                },
            ].forEach((test) => {
                let output = rm.listFormatted((r) => (r.tier >= test.min) && (r.tier <= test.max));
                let lines = output.split("\n");
                test.expected.forEach((index) => {
                    let regex = expected[index];
                    let line = lines.shift();
                    // console.log(`${line}.match(${regex}) = ${regex.test(line)}`);
                    expect(line).toMatch(regex);
                });
            });
        });

        it("should list when only active raids exist", () => {
            let rm = getTestRaidManager();
            expect(rm.addRaid("hooh", "wells", 10));
            expect(rm.addRaid("ttar", "city hall", 40));
            expect(rm.addRaid("machamp", "wisdom seekers", 30));
            expect(rm.addRaid("sableeye", "erratic", 25));
            expect(rm.addRaid("magickarp", "leaf inlay", 15));

            let expected = [
                /^.*ACTIVE RAIDS.*$/,
                /^.*Ho-oh.*Wells Fargo.*ends @.*$/,
                /^.*Magikarp.*Leaf Inlay.*ends @.*$/,
                /^.*Sableye.*Erratic.*ends @.*$/,
                /^.*Machamp.*Wisdom Seekers.*ends @.*$/,
                /^.*Tyranitar.*Hunting Fox.*ends @.*$/,
            ];

            [
                {
                    min: 1,
                    max: 5,
                    expected: [0, 1, 2, 3, 4, 5],
                },
                {
                    min: 4,
                    max: 5,
                    expected: [0, 1, 5],
                },
                {
                    min: 3,
                    max: 3,
                    expected: [0, 4],
                },
                {
                    min: 2,
                    max: 3,
                    expected: [0, 3, 4],
                },
            ].forEach((test) => {
                let output = rm.listFormatted((r) => (r.tier >= test.min) && (r.tier <= test.max));
                let lines = output.split("\n");
                test.expected.forEach((index) => {
                    let regex = expected[index];
                    let line = lines.shift();
                    // console.log(`${line}.match(${regex}) = ${regex.test(line)}`);
                    expect(line).toMatch(regex);
                });
            });
        });

        it("should list hatched eggs as active raids with unknown boss", () => {
            let rm = getTestRaidManager();
            let hatch = getOffsetDate(-5);
            rm._forceRaid("painted", 5, undefined, hatch);

            let output = rm.listFormatted((r) => r.tier === 5);
            let lines = output.split("\n");

            [
                /^.*ACTIVE RAIDS.*$/,
                /^.*T.*5 Undefined.*ends @.*$/,
            ].forEach((regex) => {
                let line = lines.shift();
                // console.log(`${line}.match(${regex}) = ${regex.test(line)}`);
                expect(line).toMatch(regex);
            });
        });

        it("should format dates using am/pm", () => {
            let rm = getTestRaidManager();
            let morning = new Date(2018, 1, 1, 0, 0);
            let afternoon = new Date(2018, 1, 1, 14, 0);
            rm._forceRaid("painted", 5, undefined, morning, RaidManager.RaidStateEnum.egg);
            rm._forceRaid("market", 5, undefined, afternoon, RaidManager.RaidStateEnum.egg);
            rm._forceRaid("erratic", 5, "hooh", morning, RaidManager.RaidStateEnum.hatched);
            rm._forceRaid("victors", 5, "latias", afternoon, RaidManager.RaidStateEnum.hatched);

            let output = rm.listFormatted((r) => r.tier === 5);
            let lines = output.split("\n");
            [
                /^.*ACTIVE RAIDS.*$/,
                /^.*Redmond's Erratic ends @ 12:45 AM/,
                /^.*Victors Coffee Co. and Roasters ends @ 2:45 PM/,
                /^.*$/,
                /^.*UPCOMING RAIDS.*$/,
                /^.*Painted Parking Lot @ 12:00 AM/,
                /^.*Fish Statue @ 2:00 PM/,
            ].forEach((regex) => {
                let line = lines.shift();
                // console.log(`${line}.match(${regex}) = ${regex.test(line)}`);
                expect(line).toMatch(regex);
            });
        });

        it("should show raid levels when reporting that no raids are available", () => {
            let rm = getTestRaidManager();
            expect(rm.listFormatted((r) => (r.tier >= 4) && (r.tier <= 5), "T4-T5")).toMatch(/^.*No raids.*\(T4-T5\).*$/);
            expect(rm.listFormatted((r) => (r.tier === 3), "T3")).toMatch(/^.*No raids.*\(T3\).*$/);
            expect(rm.listFormatted(() => false)).toMatch("No raids to report.");
        });
    });

    describe("raidListRefresh method", () => {
        it("should remove expired raids", () => {
            let rm = getTestRaidManager();
            let hatch = getOffsetDate(-(RaidManager.maxRaidActiveTime + 2));
            rm._forceRaid("painted", 5, "latias", hatch);
            expect(rm.list((r) => r.tier === 5).length).toBe(1);
            rm.raidListRefresh();
            expect(rm.list((r) => r.tier === 5).length).toBe(0);
        });

        it("should move hatched eggs to active raid with unknown boss if more than one boss is valid", () => {
            let rm = getTestRaidManager();
            let hatch = getOffsetDate(-5);
            rm._forceRaid("painted", 5, undefined, hatch, RaidManager.RaidStateEnum.egg);

            let raids = rm.list((r) => r.tier === 5);
            expect(raids.length).toBe(1);
            expect(raids[0].state).toBe(RaidManager.RaidStateEnum.egg);
            expect(raids[0].pokemon).toBe(undefined);

            rm.raidListRefresh();

            raids = rm.list((r) => r.tier === 5);
            expect(raids.length).toBe(1);
            expect(raids[0].state).toBe(RaidManager.RaidStateEnum.hatched);
            expect(raids[0].pokemon).toBe(undefined);
        });

        it("should move hatched eggs to active raid with expected boss if only one boss is valid", () => {
            let myBosses = [{ name: "Latias", tier: "Tier 5", status: "active" }];
            let rm = new RaidManager({ logger: null, strict: false, autosaveFile: null });
            rm.setGymData(gymSpecs);
            rm.setBossData(myBosses);

            let hatch = getOffsetDate(-5);
            rm._forceRaid("painted", 5, undefined, hatch, RaidManager.RaidStateEnum.egg);

            let raids = rm.list((r) => r.tier === 5);
            expect(raids.length).toBe(1);
            expect(raids[0].state).toBe(RaidManager.RaidStateEnum.egg);
            expect(raids[0].pokemon).toBeUndefined();

            rm.raidListRefresh();

            raids = rm.list((r) => r.tier === 5);
            expect(raids.length).toBe(1);
            expect(raids[0].state).toBe(RaidManager.RaidStateEnum.hatched);
            expect(raids[0].pokemon).toBeDefined();
            expect(raids[0].pokemon.name).toBe("Latias");
        });


        describe("when raids expire or hatch", () => {
            [
                { description: "should not log to console by default" },
                { description: "should log to a supplied logger", logger: new TestLogger() },
            ].forEach((test) => {
                it(test.description, () => {
                    let options = { strict: false, autosaveFile: null };
                    if (test.logger) {
                        options.logger = test.logger;
                    }
                    else {
                        spyOn(console, "log").and.callFake((m) => {
                            expect(m).toBeUndefined();
                        });
                    }

                    let rm = getTestRaidManager(options);
                    let hatch = getOffsetDate(-(RaidManager.maxRaidActiveTime + 2));
                    rm._forceRaid("painted", 5, "latias", hatch);

                    hatch = getOffsetDate(-5);
                    rm._forceRaid("market", 5, undefined, hatch, RaidManager.RaidStateEnum.egg);

                    let raids = rm.list((r) => (r.tier >= 1) && (r.tier >= 5));
                    expect(raids.length).toBe(2);

                    rm.raidListRefresh();

                    raids = rm.list((r) => (r.tier >= 1) && (r.tier <= 5));
                    expect(raids.length).toBe(1);

                    if (test.logger) {
                        expect(test.logger.output.length).toBe(2);
                        expect(test.logger.output[0]).toMatch(/^.*Raid Expired.*$/);
                        expect(test.logger.output[1]).toMatch(/^.*Raid Egg Hatched.*$/);
                    }
                    else {
                        expect(console.log).not.toHaveBeenCalled();
                    }
                });
            });
        });

        it("should be called at least once per minute but not less than 10 seconds", () => {
            jasmine.clock().install();
            let rm = getTestRaidManager();
            spyOn(rm, "raidListRefresh");
            jasmine.clock().tick(10 * 1000);
            expect(rm.raidListRefresh).not.toHaveBeenCalled();
            jasmine.clock().tick(50 * 1000);
            expect(rm.raidListRefresh).toHaveBeenCalled();
            jasmine.clock().uninstall();
        });

        it("should respect the refresh option", () => {
            jasmine.clock().install();
            let rm = getTestRaidManager({ logger: null, refresh: 5, strict: false, autosaveFile: null });
            spyOn(rm, "raidListRefresh");
            jasmine.clock().tick(6000);
            expect(rm.raidListRefresh).toHaveBeenCalled();
            jasmine.clock().uninstall();
        });

        it("should disable refresh if refresh is 0", () => {
            jasmine.clock().install();
            let rm = getTestRaidManager({ logger: null, refresh: 0, strict: false, autosaveFile: null });
            spyOn(rm, "raidListRefresh");
            jasmine.clock().tick(60 * 60 * 1000);
            expect(rm.raidListRefresh).not.toHaveBeenCalled();
            jasmine.clock().uninstall();
        });

        it("should not updates if nothing has changed", () => {
            let rm = getTestRaidManager();
            spyOn(rm, "reportRaidsUpdate");

            // Raid in progress or egg with future hatch shoud not trigger an update
            let hatch = getOffsetDate(20);
            rm._forceRaid("luke mcredmond", 4, undefined, hatch);

            expect(rm.list().length).toBe(1);
            rm.raidListRefresh();
            expect(rm.list().length).toBe(1);
            expect(rm.reportRaidsUpdate).not.toHaveBeenCalled();
        });

        it("should report updates if a raid expires", () => {
            let rm = getTestRaidManager();
            spyOn(rm, "reportRaidsUpdate");

            let hatch = getOffsetDate(-(RaidManager.maxRaidActiveTime + 2));
            rm._forceRaid("painted", 5, "latias", hatch);
            expect(rm.list().length).toBe(1);
            rm.raidListRefresh();
            expect(rm.list().length).toBe(0);
            expect(rm.reportRaidsUpdate).toHaveBeenCalled();
        });

        it("should report updates if an egg hatches", () => {
            let rm = getTestRaidManager();
            spyOn(rm, "reportRaidsUpdate");

            let hatch = getOffsetDate(-5);
            rm._forceRaid("market", 5, undefined, hatch, RaidManager.RaidStateEnum.egg);
            expect(rm.list().length).toBe(1);
            rm.raidListRefresh();
            expect(rm.list().length).toBe(1);
            expect(rm.reportRaidsUpdate).toHaveBeenCalled();
        });
    });

    describe("getSaveState method", () => {
        it("should include all raids in list order", () => {
            let rm = getTestRaidManager();
            rm.addEggCountdown(5, "erratic", 20);
            rm.addEggCountdown(4, "wells", 10);
            rm.addRaid("machamp", "elephants", 40);
            let raids = rm.list();
            let savedRaids = rm.getSaveState();
            expect(savedRaids.length).toBe(raids.length);
            for (let i = 0; i < raids.length; i++) {
                let raid = raids[i];
                let saved = savedRaids[i];
                expect(saved.gym).toBe(raid.gym.key);
                expect(saved.hatch).toBe(raid.hatchTime.getTime());
                expect(saved.expiry).toBe(raid.expiryTime.getTime());
                expect(saved.boss).toBe(raid.pokemon ? raid.pokemon.name : undefined);
                expect(saved.tier).toBe(raid.tier);
            }
        });
    });

    describe("restoreFromSaveState method", () => {
        it("should restore all raids that are still active", () => {
            let rm = getTestRaidManager();
            rm.addEggCountdown(5, "market", 10);
            rm.addRaid("ttar", "painted", 20);
            let saved = rm.getSaveState();

            let rm2 = getTestRaidManager();
            rm2.restoreFromSaveState(saved);

            let r1 = rm.list();
            let r2 = rm2.list();
            expect(r1.length).toBe(r2.length);
            for (let i = 0; i < r1.length; i++) {
                expect(r1[i]).toEqual(r2[i]);
            }
        });
    });

    describe("tryRestoreState method", () => {
        function getBaselineState(extra) {
            let baseline = getTestRaidManager();
            baseline.addEggCountdown(5, "erratic", 20);
            baseline.addEggCountdown(4, "wells", 10);
            baseline.addRaid("machamp", "elephants", 40);
            baseline.addOrUpdateRaider("erratic", { raiderName: "Fake Raider" });
            if (extra) {
                extra(baseline);
            }
            return JSON.stringify(baseline.getSaveState());
        }

        it("should silently continue if the restore file does not exist", () => {
            let logger = new TestLogger();
            spyOn(fs, "writeFileSync").and.returnValue(true);
            spyOn(fs, "existsSync").and.returnValue(false);
            spyOn(fs, "readFileSync").and.returnValue("");
            getTestRaidManager({ logger: logger, strict: false, autosaveFile: "state/test.json" });
            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.readFileSync).not.toHaveBeenCalled();
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it("should restore from the raid file if it exists", () => {
            let logger = new TestLogger();
            let baselineState = getBaselineState();
            spyOn(fs, "writeFileSync").and.returnValue(true);
            spyOn(fs, "existsSync").and.returnValue(true);
            spyOn(fs, "readFileSync").and.callFake(() => { return baselineState; });

            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: "state/test.json" });
            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();

            expect(JSON.stringify(rm.getSaveState())).toBe(baselineState);
        });

        it("should remove any expired raids on restore", () => {
            let logger = new TestLogger();
            let baselineState = getBaselineState((rm) => {
                let hatch = getOffsetDate(-50);
                rm._forceRaid("reservoir", 5, "machamp", hatch);
            });

            spyOn(fs, "writeFileSync").and.returnValue(true);
            spyOn(fs, "existsSync").and.returnValue(true);
            spyOn(fs, "readFileSync").and.callFake(() => { return baselineState; });

            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: "state/test.json" });
            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();

            expect(JSON.stringify(rm.getSaveState())).not.toBe(baselineState);
        });

        describe("with bad data", () => {
            [
                {
                    description: "should ignore unknown gyms and not log to console",
                    replacement: "xyzzy",
                    expectedOutput: /unknown gym/i,
                },
                {
                    description: "should ignore unknown gyms and log to supplied logger",
                    logger: new TestLogger(),
                    replacement: "xyzzy",
                    expectedOutput: /unknown gym/i,
                },
                {
                    description: "should ignore ambiguous gyms and not log to console",
                    replacement: "findshinydealsatsprint",
                    expectedOutput: /ambiguous gym/i,
                },
                {
                    description: "should ignore ambiguous gyms and log to supplied logger",
                    logger: new TestLogger(),
                    replacement: "findshinydealsatsprint",
                    expectedOutput: /ambiguous gym/i,
                },
            ].forEach((test) => {
                it(test.description, () => {
                    let baselineState = getBaselineState().replace("redmondpd", test.replacement);

                    spyOn(fs, "writeFileSync").and.returnValue(true);
                    spyOn(fs, "existsSync").and.returnValue(true);
                    spyOn(fs, "readFileSync").and.callFake(() => { return baselineState; });

                    let options = { strict: false, autosaveFile: "state/test.json" };
                    if (test.logger) {
                        options.logger = test.logger;
                    }
                    else {
                        spyOn(console, "log");
                    }

                    let rm = getTestRaidManager(options);

                    expect(fs.existsSync).toHaveBeenCalled();
                    expect(fs.readFileSync).toHaveBeenCalled();
                    expect(fs.writeFileSync).toHaveBeenCalled();

                    if (test.logger) {
                        expect(test.logger.output).toMatch(test.expectedOutput);
                    }
                    else {
                        expect(console.log).not.toHaveBeenCalled();
                    }

                    expect(JSON.stringify(rm.getSaveState())).not.toBe(baselineState);
                });
            });
        });

        describe("if restore fails", () => {
            [
                {
                    description: "should handle the exception and not log to console by default",
                },
                {
                    description: "should handle the exception and log to the supplied logger",
                    logger: new TestLogger(),
                },
            ].forEach((test) => {
                it(test.description, () => {
                    spyOn(fs, "writeFileSync").and.returnValue(true);
                    spyOn(fs, "existsSync").and.returnValue(true);
                    spyOn(fs, "readFileSync").and.throwError("fake error");

                    let options = { strict: false, autosaveFile: "state/test.json" };
                    if (test.logger) {
                        options.logger = test.logger;
                    }
                    else {
                        spyOn(console, "log").and.returnValue(true);
                    }

                    getTestRaidManager(options);

                    expect(fs.existsSync).toHaveBeenCalled();
                    expect(fs.readFileSync).toHaveBeenCalled();
                    expect(fs.writeFileSync).not.toHaveBeenCalled();

                    if (test.logger) {
                        expect(test.logger.output[test.logger.output.length - 1]).toMatch(/error restoring.*fake error/i);
                    }
                    else {
                        expect(console.log).not.toHaveBeenCalled();
                    }
                });
            });
        });

        describe("with a corrupt file", () => {
            [
                { contents: "{\n", expectedError: /error restoring.*json/i },
                { contents: "{}", expectedError: /error restoring.*not a function/i },
            ].forEach((badValue) => {
                it("should log an error but catch any exception if the file is corrupt", () => {
                    let logger = new TestLogger();
                    let fakeFileContents = undefined;
                    spyOn(fs, "writeFileSync").and.returnValue(true);
                    spyOn(fs, "existsSync").and.returnValue(true);
                    spyOn(fs, "readFileSync").and.callFake(() => fakeFileContents);
                    fakeFileContents = badValue;
                    getTestRaidManager({ logger: logger, strict: false, autosaveFile: "state/test.json" });
                    expect(fs.existsSync).toHaveBeenCalled();
                    expect(fs.readFileSync).toHaveBeenCalled();
                    expect(fs.writeFileSync).not.toHaveBeenCalled();
                    expect(logger.output[logger.output.length - 1]).toMatch(/error restoring.*JSON/i);
                });
            });
        });
    });

    describe("trySaveState method", () => {
        function verifyWriteFileCall(file, state, options, expectedState) {
            expect(file).toMatch(/test\.json/i);
            expect(options.encoding).toBe("utf8");
            expect(options.flag).toBe("w");
            if (expectedState) {
                expect(state).toBe(expectedState);
            }
        }

        it("should try to write state to the autosave file", () => {
            spyOn(fs, "writeFileSync").and.callFake(myVerifyWrite);
            let rm = getTestRaidManager({ logger: null, strict: false, autosaveFile: "state/test.json" });
            rm.addEggCountdown(5, "erratic", 20);
            rm.addEggCountdown(4, "wells", 10);
            rm.addRaid("machamp", "elephants", 40);
            rm.addOrUpdateRaider("elephants", { raiderName: "fake raider" });

            let expectedCount = fs.writeFileSync.calls.count() + 1;
            let expectedState = JSON.stringify(rm.getSaveState());
            rm.trySaveState();
            expect(fs.writeFileSync.calls.count()).toEqual(expectedCount);

            function myVerifyWrite(file, state, options) {
                verifyWriteFileCall(file, state, options, expectedState);
            }
        });

        it("should log a successful write to the autosave file", () => {
            let logger = new TestLogger();
            spyOn(fs, "writeFileSync").and.returnValue(true);
            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: "state/test.json" });
            rm.addEggCountdown(5, "erratic", 20);
            rm.addEggCountdown(4, "wells", 10);
            rm.addRaid("machamp", "elephants", 40);

            logger.reset();
            rm.trySaveState();
            expect(logger.output[0]).toMatch(/saved state to/i);
        });

        it("should log a failed write to the autosave file and catch the exception", () => {
            let shouldFail = false;
            let logger = new TestLogger();
            spyOn(fs, "writeFileSync").and.callFake(() => {
                if (shouldFail) {
                    throw new Error("fake error");
                }
            });

            let rm = getTestRaidManager({ logger: logger, strict: false, autosaveFile: "state/test.json" });
            rm.addEggCountdown(5, "erratic", 20);
            rm.addEggCountdown(4, "wells", 10);
            rm.addRaid("machamp", "elephants", 40);

            shouldFail = true;
            logger.reset();
            rm.trySaveState();
            expect(logger.output[0]).toMatch(/error saving raid state/i);
        });
    });
});
