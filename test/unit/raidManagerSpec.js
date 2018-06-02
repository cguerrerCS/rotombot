"use strict";

const RaidManager = require("../../lib/raidManager");
const { FlexTime } = require("botsbits");

const bosses = [
    { name: "Latias", tier: "Tier 5" },
    { name: "Ho-oh", tier: "Tier 5" },
    { name: "Houndoom", tier: "Tier 4" },
    { name: "Tyranitar", tier: "Tier 4" },
    { name: "Aggron", tier: "Tier 4" },
    { name: "Absol", tier: "Tier 4" },
    { name: "Walrein", tier: "Tier 4" },
    { name: "Machamp", tier: "Tier 3" },
    { name: "Gengar", tier: "Tier 3" },
    { name: "Jynx", tier: "Tier 3" },
    { name: "Pinsir", tier: "Tier 3" },
    { name: "Granbull", tier: "Tier 3" },
    { name: "Piloswine", tier: "Tier 3" },
    { name: "Exeggutor", tier: "Tier 2" },
    { name: "Misdreavus", tier: "Tier 2" },
    { name: "Sneasel", tier: "Tier 2" },
    { name: "Sableye", tier: "Tier 2" },
    { name: "Mawile", tier: "Tier 2" },
    { name: "Magikarp", tier: "Tier 1" },
    { name: "Wailmer", tier: "Tier 1" },
    { name: "Swablu", tier: "Tier 1" },
    { name: "Shuppet", tier: "Tier 1" },
    { name: "Duskull", tier: "Tier 1" },
    { name: "Snorunt", tier: "Tier 1" },
];

const badBosses = [
    { Name: "Latias", tier: "Tier 5" },
    { name: "Tyranitar", TIER: "Tier 6" },
    { name: "Ho-oh" },
    { tier: "Tier 4" },
];

const gyms = [
    { city: "Redmond", name: "Cleveland Fountain", friendlyName: "Cleveland Fountain", lng: "47.673667", lat: "-122.125595" },
    { city: "Redmond", name: "Gridlock Light Sculpture", friendlyName: "Gridlock", lng: "47.673298", lat: "-122.125256" },
    { city: "Redmond", name: "Painted Parking Lot", friendlyName: "Painted Parking Lot", lng: "47.672712", lat: "-122.124617" },
    { city: "Redmond", name: "Redmond Town Center Fish Statue", friendlyName: "Farmers Market", lng: "47.671892", lat: "-122.124425" },
    { city: "Redmond", name: "Redmond Clock Tower", friendlyName: "Clock Tower", lng: "47.674170", lat: "-122.123056" },
    { city: "Redmond", name: "Victors Coffee Co. and Roasters", friendlyName: "Victors Coffeeshop", lng: "47.674577", lat: "-122.121900" },
    { city: "Redmond", name: "Redmond's Erratic", friendlyName: "Redmond Erratic", lng: "47.671955", lat: "-122.119251" },
    { city: "Redmond", name: "Kids Playing Baseball Mural", friendlyName: "Mattress Firm", lng: "47.672620", lat: "-122.116819" },
    { city: "Redmond", name: "BJ's Brewmural", friendlyName: "BJs Brewhouse", lng: "47.668914", lat: "-122.119748" },
    { city: "Redmond", name: "Mural (Wells Fargo)", friendlyName: "Wells Fargo", lng: "47.678650", lat: "-122.127309" },
    { city: "Redmond", name: "Wisdom Seekers in Redmond", friendlyName: "Redmond Library", lng: "47.678799", lat: "-122.128532" },
    { city: "Redmond", name: "Luke McRedmond's Paired Beavers", friendlyName: "Luke McRedmond", lng: "47.673250", lat: "-122.132160" },
    { city: "Redmond", name: "Soulfood Books and Cafe", friendlyName: "Soul Foods", lng: "47.675219", lat: "-122.130386" },
    { city: "Redmond", name: "West Ironcycle", friendlyName: "Ben Franklin", lng: "47.675691", lat: "-122.130123" },
    { city: "Redmond", name: "Hunting Fox", friendlyName: "city Hall", lng: "47.678920", lat: "-122.130520" },
    { city: "Redmond", name: "Weiner Elephants", friendlyName: "Redmond PD", lng: "47.680386", lat: "-122.128889" },
    { city: "Redmond", name: "Portal II", friendlyName: "Portal 2", lng: "47.680447", lat: "-122.131723" },
    { city: "Redmond", name: "The Last Test", friendlyName: "Last Test", lng: "47.682691", lat: "-122.132021" },
    { city: "Redmond", name: "Community Rockstars", friendlyName: "Community Rockstars", lng: "47.683612", lat: "-122.132734" },
    { city: "Redmond", name: "Redmond Twist", friendlyName: "Evergreen", lng: "47.681979", lat: "-122.123692" },
    { city: "Redmond", name: "Mysterious Hatch", friendlyName: "Reservoir Park", lng: "47.685378", lat: "-122.122394" },
    { city: "Redmond", name: "Nike Park", friendlyName: "Nike Park", lng: "47.683823", lat: "-122.110841" },
    { city: "Redmond", name: "St. Jude Walking Trail", friendlyName: "St Judes", lng: "47.693495", lat: "-122.116883" },
    { city: "Redmond", name: "Redmond Meadow Park", friendlyName: "Meadow Park", lng: "47.695703", lat: "-122.126550" },
    { city: "Redmond", name: "Leaf Inlay in Sidewalk", friendlyName: "Leaf Inlay", lng: "47.689362", lat: "-122.114435" },
    { city: "Redmond", name: "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", friendlyName: "LDS (Hartman Park)", lng: "47.690909", lat: "-122.110964" },
    { city: "Redmond", name: "Hartman Park", friendlyName: "Hartman Park Sign", lng: "47.691002", lat: "-122.110177" },
    { city: "Redmond", name: "Jim Palmquist Memorial Plaque", friendlyName: "Hartman Park (Baseball)", lng: "47.692436", lat: "-122.107328" },
    { city: "Redmond", name: "Redmond Pool", friendlyName: "Redmond Pool", lng: "47.692516", lat: "-122.106308" },
    { city: "Redmond", name: "Bear Creek Water Tower", friendlyName: "Bear Creek Water Tower", lng: "47.687974", lat: "-122.103674" },
    { city: "Redmond", name: "Education Hill Pig", friendlyName: "Education Hill Pig", lng: "47.674945", lat: "-122.111546" },
];

let badGyms = [
    { name: "Gridlock Light Sculpture", friendlyName: "Gridlock", lng: "47.673298", lat: "-122.125256" },
];

function getTestRaidManager(options) {
    options = options || { logger: undefined, strict: false };
    let rm = new RaidManager(options);
    rm.setBossData(bosses);
    rm.setGymData(gyms);
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
            rm.setGymData(gyms);
            expect(rm.gyms.length).toBe(gyms.length);
        });

        it("should initialize the search object if no search is supplied", () => {
            let rm = new RaidManager();
            rm.setGymData(gyms);
            expect(rm.gymSearch).toBeDefined();
        });

        it("should use a prebuilt search object if supplied", () => {
            let searchObject = new TestSearch();
            let rm = new RaidManager();
            rm.setGymData(gyms, searchObject);
            expect(rm.gymSearch).toBe(searchObject);
        });

        it("should throw for invalid gym data", () => {
            let rm = new RaidManager();
            expect(() => rm.setGymData(badGyms)).toThrowError();
        });

        it("should add a mapLink if none is supplied", () => {
            let rm = new RaidManager();
            let myGyms = [
                { city: "Redmond", name: "Cleveland Fountain", friendlyName: "Cleveland Fountain", lng: "47.673667", lat: "-122.125595" },
            ];
            rm.setGymData(myGyms);
            expect(rm.gyms[0].mapLink).toBeDefined();
        });

        it("should use the supplied mapLink if present", () => {
            let rm = new RaidManager();
            let myGyms = [
                { city: "Redmond", name: "Cleveland Fountain", friendlyName: "Cleveland Fountain", lng: "47.673667", lat: "-122.125595", mapLink: "test" },
            ];
            rm.setGymData(myGyms);
            expect(rm.gyms[0].mapLink).toBe("test");
        });
    });

    describe("setBossData method", () => {
        it("should accept valid boss data", () => {
            let rm = new RaidManager();
            rm.setBossData(bosses);
            expect(rm.bosses.length).toBe(bosses.length);
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
            rm.setGymData(gyms);
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
            rm.setGymData(gyms);
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
                expect(gym.name).toBe(test[1]);
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
            let gym = rm.validateGym(gyms[3]);
            expect(gym).toBe(gyms[3]);
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
                expect(gym.name).toBe(test[1]);
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
            expect(() => rm.tryGetGym(gyms[3])).toThrowError("Must use gym name for tryGetGym.");
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
                ["pd", "Weiner Elephants", true],
                ["city hall", "Hunting Fox", false],
            ].forEach((test) => {
                let raid = rm.tryGetRaid(test[0]);
                if (test[2]) {
                    expect(raid.gym.name).toBe(test[1]);
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
            expect(() => rm.tryGetRaid(gyms[3])).toThrowError("Must use gym name for tryGetGym.");
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
                expect(raid.gym.name).toBe(test[3]);
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
            let rm = getTestRaidManager({ logger: logger, strict: false });
            rm.addRaid("ttar", "wells", 20);
            expect(logger.output.length).toBe(1);
            expect(logger.output[0]).toMatch(/.*Active Raid Added.*/i);
        });

        describe("in strict mode", () => {
            it("should throw if a different raid is already reported for the location", () => {
                let rm = getTestRaidManager({ logger: undefined, strict: true });
                rm.addRaid("hooh", "painted", 20);
                expect(() => rm.addRaid("latias", "painted", 40)).toThrowError(/^.*Raid.*already has.*boss.*$/);
                expect(() => rm.addRaid("hooh", "painted", 40)).toThrowError(/^New end time.*too far from existing.*$/);
                expect(() => rm.addRaid("hooh", "painted", 10)).toThrowError(/^New end time.*too far from existing.*$/);
            });

            it("should adjust the end time of an existing raid within tolerance if other details match", () => {
                let rm = getTestRaidManager({ logger: undefined, strict: true });
                let originalExpiry = rm.addRaid("hooh", "painted", 20).expiryTime;
                let newRaid = rm.addRaid("hooh", "painted", 22);
                expect(newRaid.expiryTime).toBeGreaterThan(originalExpiry);

                newRaid = rm.addRaid("hooh", "painted", 18);
                expect(newRaid.expiryTime).toBeLessThan(originalExpiry);
            });

            it("should add a boss to an undefined raid of the same tier, adjusting time within tolerance", () => {
                let rm = getTestRaidManager({ logger: undefined, strict: true });
                let hatch = getOffsetDate(-25); // 20 left
                let originalExpiry = rm._forceRaid("painted", 5, undefined, hatch).expiryTime;
                let newRaid = rm.addRaid("hooh", "painted", 22);
                expect(newRaid.expiryTime).toBeGreaterThan(originalExpiry);
                expect(newRaid.pokemon.name).toBe("Ho-oh");
            });

            it("should throw for an undefined raid if tier does not match or if time is out of tolerance", () => {
                let rm = getTestRaidManager({ logger: undefined, strict: true });
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

        describe("in strict mode", () => {
            it("should succeed if the egg is hatched, boss is unknown and new boss is of the right tier", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
                let hatch = getOffsetDate(-10);
                rm._forceRaid("wells", 5, undefined, hatch, RaidManager.RaidStateEnum.hatched);
                let raid = rm.setRaidBoss("hooh", "wells");
                expect(raid.pokemon.name).toBe("Ho-oh");
                expect(raid.hatchTime).toBe(hatch);
            });

            it("should throw if the raid already has a different boss", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
                rm.addRaid("hooh", "luke", 30);
                expect(() => rm.setRaidBoss("latias", "luke")).toThrowError(/Raid.*already has.*boss.*/);
            });

            it("should succeed if the raid already has the same boss", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
                rm.addRaid("hooh", "luke", 30);
                expect(() => rm.setRaidBoss("hooh", "luke")).not.toThrowError();
            });

            it("should throw if boss is of the wrong tier", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
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
            let rm = getTestRaidManager({ logger: logger, strict: false });
            rm.addEggCountdown(5, "wells", 20);
            expect(logger.output.length).toBe(1);
            expect(logger.output[0]).toMatch(/.*Raid egg added with relative time.*/i);
        });

        describe("in strict mode", () => {
            it("should succeed if existing raid has matching tier and expiry within tolerance", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
                let originalExpiry = rm.addEggCountdown(5, "erratic", 20).expiryTime;
                let newExpiry = rm.addEggCountdown(5, "erratic", 22).expiryTime;

                expect(newExpiry).toBeGreaterThan(originalExpiry);

                newExpiry = rm.addEggCountdown(5, "erratic", 18).expiryTime;
                expect(newExpiry).toBeLessThan(originalExpiry);
            });

            it("should throw if the raid already has a boss", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
                rm.addRaid("hooh", "luke", 30);
                expect(() => rm.addEggCountdown(5, "luke", 20)).toThrowError(/Cannot replace existing Ho-oh.*/);
            });

            it("should throw if an existing egg has a different tier", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
                rm.addEggCountdown(4, "ironcycle", 20);
                expect(() => rm.addEggCountdown(5, "ironcycle", 20)).toThrowError(/Cannot replace existing tier 4.*/);
            });

            it("should throw if the new timer is too far from the existing one", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
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
            let rm = getTestRaidManager({ logger: logger, strict: false });
            let validHatch = FlexTime.getFlexTime(Date.now(), 20).toString();

            rm.addEggAbsolute(5, "wells", validHatch);
            expect(logger.output.length).toBe(1);
            expect(logger.output[0]).toMatch(/.*Raid egg added with absolute time.*/i);
        });

        describe("in strict mode", () => {
            it("should succeed if existing raid has matching tier and expiry is within tolerance", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
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
                let rm = getTestRaidManager({ strict: true, logger: undefined });
                rm.addRaid("hooh", "luke", 30);
                let hatch = getOffsetDate(30);
                expect(() => rm.addEggAbsolute(5, "luke", hatch)).toThrowError(/Cannot replace existing Ho-oh.*/);
            });

            it("should throw if an existing egg has a different tier", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
                rm.addEggCountdown(4, "ironcycle", 20);
                let hatch = getOffsetDate(20);
                expect(() => rm.addEggAbsolute(5, "ironcycle", hatch)).toThrowError(/Cannot replace existing tier 4.*/);
            });

            it("should throw if the new timer is too far from the existing one", () => {
                let rm = getTestRaidManager({ strict: true, logger: undefined });
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
            expect(rm.addRaid("machamp", "anderson", 30));
            expect(rm.addRaid("sableeye", "erratic", 25));
            expect(rm.addRaid("magickarp", "salmon circles", 15));

            let expected = [
                /^.*ACTIVE RAIDS.*$/,
                /^.*Ho-oh.*Wells Fargo.*ends @.*$/,
                /^.*Magikarp.*Ironcycle.*ends @.*$/,
                /^.*Sableye.*Erratic.*ends @.*$/,
                /^.*Machamp.*Redmond Town Center.*ends @.*$/,
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
            expect(rm.addRaid("machamp", "anderson", 30));
            expect(rm.addRaid("sableeye", "erratic", 25));
            expect(rm.addRaid("magickarp", "salmon circles", 15));

            let expected = [
                /^.*ACTIVE RAIDS.*$/,
                /^.*Ho-oh.*Wells Fargo.*ends @.*$/,
                /^.*Magikarp.*Ironcycle.*ends @.*$/,
                /^.*Sableye.*Erratic.*ends @.*$/,
                /^.*Machamp.*Redmond Town Center.*ends @.*$/,
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

        it("should move hatched eggs to active raid with unknown boss", () => {
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

        it("should log when raids expire or hatch", () => {
            let testLogger = new TestLogger();
            let rm = getTestRaidManager({ strict: false, logger: testLogger });
            let hatch = getOffsetDate(-(RaidManager.maxRaidActiveTime + 2));
            rm._forceRaid("painted", 5, "latias", hatch);

            hatch = getOffsetDate(-5);
            rm._forceRaid("market", 5, undefined, hatch, RaidManager.RaidStateEnum.egg);

            let raids = rm.list((r) => (r.tier >= 1) && (r.tier >= 5));
            expect(raids.length).toBe(2);

            rm.raidListRefresh();

            raids = rm.list((r) => (r.tier >= 1) && (r.tier <= 5));
            expect(raids.length).toBe(1);

            expect(testLogger.output.length).toBe(2);
            expect(testLogger.output[0]).toMatch(/^.*Raid Expired.*$/);
            expect(testLogger.output[1]).toMatch(/^.*Raid Egg Hatched.*$/);
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
            let rm = getTestRaidManager({ logger: undefined, refresh: 5, strict: false });
            spyOn(rm, "raidListRefresh");
            jasmine.clock().tick(6000);
            expect(rm.raidListRefresh).toHaveBeenCalled();
            jasmine.clock().uninstall();
        });

        it("should disable refresh if refresh is 0", () => {
            jasmine.clock().install();
            let rm = getTestRaidManager({ logger: undefined, refresh: 0, strict: false });
            spyOn(rm, "raidListRefresh");
            jasmine.clock().tick(60 * 60 * 1000);
            expect(rm.raidListRefresh).not.toHaveBeenCalled();
            jasmine.clock().uninstall();
        });
    });
});
