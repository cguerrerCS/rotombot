"use strict";

const RaidManager = require("../../raidManager3");
const { FlexTime } = require("botsbits");

const bosses = [
    { RaidBoss: "Latias", RaidTier: "Tier 5" },
    { RaidBoss: "Ho-oh", RaidTier: "Tier 5" },
    { RaidBoss: "Houndoom", RaidTier: "Tier 4" },
    { RaidBoss: "Tyranitar", RaidTier: "Tier 4" },
    { RaidBoss: "Aggron", RaidTier: "Tier 4" },
    { RaidBoss: "Absol", RaidTier: "Tier 4" },
    { RaidBoss: "Walrein", RaidTier: "Tier 4" },
    { RaidBoss: "Machamp", RaidTier: "Tier 3" },
    { RaidBoss: "Gengar", RaidTier: "Tier 3" },
    { RaidBoss: "Jynx", RaidTier: "Tier 3" },
    { RaidBoss: "Pinsir", RaidTier: "Tier 3" },
    { RaidBoss: "Granbull", RaidTier: "Tier 3" },
    { RaidBoss: "Piloswine", RaidTier: "Tier 3" },
    { RaidBoss: "Exeggutor", RaidTier: "Tier 2" },
    { RaidBoss: "Misdreavus", RaidTier: "Tier 2" },
    { RaidBoss: "Sneasel", RaidTier: "Tier 2" },
    { RaidBoss: "Sableye", RaidTier: "Tier 2" },
    { RaidBoss: "Mawile", RaidTier: "Tier 2" },
    { RaidBoss: "Magikarp", RaidTier: "Tier 1" },
    { RaidBoss: "Wailmer", RaidTier: "Tier 1" },
    { RaidBoss: "Swablu", RaidTier: "Tier 1" },
    { RaidBoss: "Shuppet", RaidTier: "Tier 1" },
    { RaidBoss: "Duskull", RaidTier: "Tier 1" },
    { RaidBoss: "Snorunt", RaidTier: "Tier 1" },
];

const gyms = [
    { City: "Redmond", RaidLocation: "Cleveland Fountain", FriendlyName: "Cleveland Fountain", Lng: "47.673667", Lat: "-122.125595", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.673667,-122.1255950" },
    { City: "Redmond", RaidLocation: "Gridlock Light Sculpture", FriendlyName: "Gridlock", Lng: "47.673298", Lat: "-122.125256", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.673298,-122.1252560" },
    { City: "Redmond", RaidLocation: "Painted Parking Lot", FriendlyName: "Painted Parking Lot", Lng: "47.672712", Lat: "-122.124617", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.672712,-122.1246170" },
    { City: "Redmond", RaidLocation: "Redmond Town Center Fish Statue", FriendlyName: "Farmers Market", Lng: "47.671892", Lat: "-122.124425", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.671892,-122.1244250" },
    { City: "Redmond", RaidLocation: "Redmond Clock Tower", FriendlyName: "Clock Tower", Lng: "47.674170", Lat: "-122.123056", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.674170,-122.1230560" },
    { City: "Redmond", RaidLocation: "Victors Coffee Co. and Rosters", FriendlyName: "Victors Coffeeshop", Lng: "47.674577", Lat: "-122.121900", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.674577,-122.1219000" },
    { City: "Redmond", RaidLocation: "Redmond's Erratic", FriendlyName: "Redmond Erratic", Lng: "47.671955", Lat: "-122.119251", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.671955,-122.1192510" },
    { City: "Redmond", RaidLocation: "Kids Playing Baseball Mural", FriendlyName: "Mattress Firm", Lng: "47.672620", Lat: "-122.116819", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.672620,-122.1168190" },
    { City: "Redmond", RaidLocation: "BJ's Brewmural", FriendlyName: "BJs Brewhouse", Lng: "47.668914", Lat: "-122.119748", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.668914,-122.1197480" },
    { City: "Redmond", RaidLocation: "Mural (Wells Fargo)", FriendlyName: "Wells Fargo", Lng: "47.678650", Lat: "-122.127309", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.678650,-122.1273090" },
    { City: "Redmond", RaidLocation: "Wisdom Seekers in Redmond", FriendlyName: "Redmond Library", Lng: "47.678799", Lat: "-122.128532", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.678799,-122.1285320" },
    { City: "Redmond", RaidLocation: "Luke McRedmond's Paired Beavers", FriendlyName: "Luke McRedmond", Lng: "47.673250", Lat: "-122.132160", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.673250,-122.1321600" },
    { City: "Redmond", RaidLocation: "Soulfood Books and Cafe", FriendlyName: "Soul Foods", Lng: "47.675219", Lat: "-122.130386", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.675219,-122.1303860" },
    { City: "Redmond", RaidLocation: "West Ironcycle", FriendlyName: "Ben Franklin", Lng: "47.675691", Lat: "-122.130123", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.675691,-122.1301230" },
    { City: "Redmond", RaidLocation: "Hunting Fox", FriendlyName: "City Hall", Lng: "47.678920", Lat: "-122.130520", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.678920,-122.1305200" },
    { City: "Redmond", RaidLocation: "Weiner Elephants", FriendlyName: "Redmond PD", Lng: "47.680386", Lat: "-122.128889", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.680386,-122.1288890" },
    { City: "Redmond", RaidLocation: "Portal II", FriendlyName: "Portal 2", Lng: "47.680447", Lat: "-122.131723", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.680447,-122.1317230" },
    { City: "Redmond", RaidLocation: "The Last Test", FriendlyName: "Last Test", Lng: "47.682691", Lat: "-122.132021", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.682691,-122.1320210" },
    { City: "Redmond", RaidLocation: "Community Rockstars", FriendlyName: "Community Rockstars", Lng: "47.683612", Lat: "-122.132734", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.683612,-122.1327340" },
    { City: "Redmond", RaidLocation: "Redmond Twist", FriendlyName: "Evergreen", Lng: "47.681979", Lat: "-122.123692", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.681979,-122.1236920" },
    { City: "Redmond", RaidLocation: "Mysterious Hatch", FriendlyName: "Reservoir Park", Lng: "47.685378", Lat: "-122.122394", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.685378,-122.1223940" },
    { City: "Redmond", RaidLocation: "Nike Park", FriendlyName: "Nike Park", Lng: "47.683823", Lat: "-122.110841", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.683823,-122.1108410" },
    { City: "Redmond", RaidLocation: "St. Jude Walking Trail", FriendlyName: "St Judes", Lng: "47.693495", Lat: "-122.116883", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.693495,-122.1168830" },
    { City: "Redmond", RaidLocation: "Redmond Meadow Park", FriendlyName: "Meadow Park", Lng: "47.695703", Lat: "-122.126550", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.695703,-122.1265500" },
    { City: "Redmond", RaidLocation: "Leaf Inlay in Sidewalk", FriendlyName: "Leaf Inlay", Lng: "47.689362", Lat: "-122.114435", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.689362,-122.1144350" },
    { City: "Redmond", RaidLocation: "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", FriendlyName: "LDS (Hartman Park)", Lng: "47.690909", Lat: "-122.110964", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.690909,-122.1109640" },
    { City: "Redmond", RaidLocation: "Hartman Park", FriendlyName: "Hartman Park Sign", Lng: "47.691002", Lat: "-122.110177", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.691002,-122.1101770" },
    { City: "Redmond", RaidLocation: "Jim Palmquist Memorial Plaque", FriendlyName: "Hartman Park (Baseball)", Lng: "47.692436", Lat: "-122.107328", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.692436,-122.1073280" },
    { City: "Redmond", RaidLocation: "Redmond Pool", FriendlyName: "Redmond Pool", Lng: "47.692516", Lat: "-122.106308", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.692516,-122.1063080" },
    { City: "Redmond", RaidLocation: "Bear Creek Water Tower", FriendlyName: "Bear Creek Water Tower", Lng: "47.687974", Lat: "-122.103674", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.687974,-122.1036740" },
    { City: "Redmond", RaidLocation: "Education Hill Pig", FriendlyName: "Education Hill Pig", Lng: "47.674945", Lat: "-122.111546", MapLink: "https://www.google.com/maps/dir/?api=1&destination=47.674945,-122.1115460" },
];

function getTestRaidManager() {
    let rm = new RaidManager();
    rm.setBossData(bosses);
    rm.setGymData(gyms);
    return rm;
}

describe("raidManager", () => {
    describe("validateTier static method", () => {
        it("should accept numbers in range and well-formatted strings", () => {
            [
                [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], ["1", 1], ["2", 2], ["3", 3], ["4", 4], ["5", 5], ["Tier 1", 1], ["Tier 2", 2], ["Tier 3", 3], ["Tier 4", 4], ["Tier 5", 5]
            ].forEach((test) => {
                expect(RaidManager.validateTier(test[0])).toBe(test[1]);
            });
        });

        it("should reject numbers out of range, poorly formatted strings, and objects", () => {
            [
                -1, 0, 6, "-100", "600", "Tier 7", "tier 1", "L1", "blah-di-blah", undefined, {}, /Tier 1/
            ].forEach((v) => {
                expect(() => RaidManager.validateTier(v)).toThrow();
            });
        });
    });

    describe("validateHatchTime static method", () => {
        it("should accept valid times", () => {
            [1, 10, 59].forEach((minutes) => {
                let date = new Date(Date.now() + (minutes * 60 * 1000));
                let time = new FlexTime(date);
                let validTime = RaidManager.validateHatchTime(time.toString());
                expect(validTime.getHours()).toBe(time.getHours());
                expect(validTime.getMinutes()).toBe(time.getMinutes());
            });
        });

        it("should reject invalid times", () => {
            [-2, 65].forEach((minutes) => {
                let date = new Date(Date.now() + (minutes * 60 * 1000));
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
        it("should match a valid boss", () => {
            let rm = getTestRaidManager();
            [
                ["latias", "Latias"],
                ["ho-oh", "Ho-oh"],
                ["ttar", "Tyranitar"],
                ["hooh", "Ho-oh"],
            ].forEach((test) => {
                let boss = rm.validateBoss(test[0]);
                expect(boss.RaidBoss).toBe(test[1]);
            });
        });

        it("should throw for an invalid boss", () => {
            let rm = getTestRaidManager();
            ["BOGOBOSS", "WTF"].forEach((bossName) => {
                expect(() => rm.validateBoss(bossName)).toThrow();
            });
        });
    });

    describe("validateGym method", () => {
        it("should match a valid gym", () => {
            let rm = getTestRaidManager();
            [
                ["painted", "Painted Parking Lot"],
                ["market", "Redmond Town Center Fish Statue"],
                ["pd", "Weiner Elephants"],
                ["city hall", "Hunting Fox"],
            ].forEach((test) => {
                let gym = rm.validateGym(test[0]);
                expect(gym.RaidLocation).toBe(test[1]);
            });
        });

        it("should throw for an invalid gym", () => {
            let rm = getTestRaidManager();
            ["BOGOGYM", "WTF"].forEach((gymName) => {
                expect(() => rm.validateGym(gymName)).toThrow();
            });
        });
    });

    describe("addRaid method", () => {
        it("should add a raid with valid gym, boss and time remaining even if a raid is already reported for the location", () => {
            let rm = getTestRaidManager();
            [
                ["hooh", "painted", 20, "Painted Parking Lot"],
                ["latias", "city hall", 1, "Hunting Fox"],
                ["ttar", "painted", 44, "Painted Parking Lot"],
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
    });

    describe("setRaidBoss method", () => {
        it("should add a boss to an existing raid with no boss, regardless of tier", () => {
            let rm = getTestRaidManager();
            let hatch = FlexTime.getFlexTime(Date.now(), -5);
            let raid = rm._forceRaid("painted", 5, undefined, hatch.toString());

            expect(raid).toBeDefined();

            let bossRaid = rm.setRaidBoss("ttar", "painted");
            expect(bossRaid).toBeDefined();
            expect(bossRaid.pokemon.RaidBoss).toBe("Tyranitar");
        });

        it("should replace the boss of an existing raid with a boss, regardless of tier", () => {
            let rm = getTestRaidManager();
            let hatch = FlexTime.getFlexTime(Date.now(), -5);
            let raid = rm._forceRaid("painted", 5, "latias", hatch.toString());

            expect(raid).toBeDefined();

            let bossRaid = rm.setRaidBoss("ttar", "painted");
            expect(bossRaid).toBeDefined();
            expect(bossRaid.pokemon.RaidBoss).toBe("Tyranitar");
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
    });

    describe("addEggCountdown method", () => {

    });

    describe("addEggAbsolute method", () => {

    });

    describe("removeRaid method", () => {

    });

    describe("list method", () => {

    });

    describe("listFormatted method", () => {

    });


});
