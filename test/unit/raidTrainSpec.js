"use strict";

const RaidManager = require("../../lib/raidManager");
const GymDirectory = require("../../lib/gymDirectory");
const RaidTrain = require("../../lib/raidTrain");

const bosses = [
    { name: "Latias", tier: "Tier 5", image: "t5.png", status: "active" },
    { name: "Kyogre", tier: "Tier 5", image: "t5.png", status: "active" },
    { name: "Ho-oh", tier: "Tier 5", image: "t5.png", status: "active" },
    { name: "Zapdos", tier: "Tier 5", image: "t5.png", status: "inactive" },
    { name: "Houndoom", tier: "Tier 4", image: "t4.png", status: "active" },
    { name: "Tyranitar", tier: "Tier 4", image: "t4.png", status: "active" },
    { name: "Aggron", tier: "Tier 4", image: "t4.png", status: "active" },
    { name: "Absol", tier: "Tier 4", image: "t4.png", status: "active" },
    { name: "Walrein", tier: "Tier 4", image: "t4.png", status: "active" },
    { name: "Machamp", tier: "Tier 3", image: "t3.png", status: "active" },
    { name: "Gengar", tier: "Tier 3", image: "t3.png", status: "active" },
    { name: "Jynx", tier: "Tier 3", image: "t3.png", status: "active" },
    { name: "Pinsir", tier: "Tier 3", image: "t3.png", status: "active" },
    { name: "Granbull", tier: "Tier 3", image: "t3.png", status: "active" },
    { name: "Piloswine", tier: "Tier 3", image: "t3.png", status: "active" },
    { name: "Exeggutor", tier: "Tier 2", image: "t2.png", status: "active" },
    { name: "Misdreavus", tier: "Tier 2", image: "t2.png", status: "active" },
    { name: "Sneasel", tier: "Tier 2", image: "t2.png", status: "active" },
    { name: "Sableye", tier: "Tier 2", image: "t2.png", status: "active" },
    { name: "Mawile", tier: "Tier 2", image: "t2.png", status: "active" },
    { name: "Magikarp", tier: "Tier 1", image: "t1.png", status: "active" },
    { name: "Wailmer", tier: "Tier 1", image: "t1.png", status: "active" },
    { name: "Swablu", tier: "Tier 1", image: "t1.png", status: "active" },
    { name: "Shuppet", tier: "Tier 1", image: "t1.png", status: "active" },
    { name: "Duskull", tier: "Tier 1", image: "t1.png", status: "active" },
    { name: "Snorunt", tier: "Tier 1", image: "t1.png", status: "active" },
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

function getTestRaidManager(options) {
    options = options || { logger: null, strict: false, autosaveFile: null, refresh: 30 };
    let rm = new RaidManager(options);
    rm.setBossData(bosses);
    rm.setGymData(gymDirectory);
    return rm;
}

describe("RaidTrain object", () => {
    describe("addStop method", () => {
        let rm = getTestRaidManager();
        let raids = [
            { boss: "hooh", gym: "painted", time: 20, officialName: "Painted Parking Lot" },
            { boss: "latias", gym: "city hall", time: 1, officialName: "Hunting Fox" },
            { boss: "ttar", gym: "wells", time: 44, officialName: "Mural (Wells Fargo)" },
            { boss: "hooh", gym: "erratic", time: 43, officialName: "Redmond's Erratic" },
        ];
        let extraRaids = [
            { boss: "latias", gym: "evergreen", time: 40, officialName: "Redmond Twist" },
        ];

        raids.forEach((test) => rm.addRaid(test.boss, test.gym, test.time));
        extraRaids.forEach((test) => rm.addRaid(test.boss, test.gym, test.time));

        it("should add raids that exist to the end of the train by default", () => {
            let train = new RaidTrain(rm);
            raids.forEach((test) => {
                expect(train.addStop(test.gym)).toBeDefined();
            });

            let stops = train.getStops();
            expect(stops.length).toBe(raids.length);
            for (let i = 0; i < stops.length; i++) {
                expect(stops[i].gym.officialName).toBe(raids[i].officialName);
            }
        });

        it("should insert raids that exist before a specified other raid", () => {
            let train = new RaidTrain(rm);
            raids.forEach((test) => expect(train.addStop(test.gym)).toBeDefined());

            expect(train.addStop(extraRaids[0].gym, { before: raids[0].gym })).toBeDefined();
            let stops = train.getStops();
            expect(stops.length).toBe(raids.length + 1);
            expect(stops[0].gym.officialName).toBe(extraRaids[0].officialName);
        });
    });
});
