"use strict";

const Gym = require("../../lib/gym");
const GymZone = require("../../lib/gymZone");

describe("GymZone object", () => {
    describe("constructor", () => {
        it("should throw if gyms initializer is not an array with at least one element", () => {
            expect(() => new GymZone({})).toThrowError("GymZone initializer must be an array with at least one element.");
            expect(() => new GymZone([])).toThrowError("GymZone initializer must be an array with at least one element.");
        });

        it("should throw if gyms initializer contains non-Gym objects", () => {
            let gyms = [{
                zones: ["Redmond", "Kirkland", "Bellevue"],
                city: "Houghton",
                officialName: "'Bogus-Gym', in Houghton.",
                friendlyName: "Houghton \"Bogus\" gym #1",
                longitude: 47.666658,
                latitude: -122.165583,
                isExEligible: false,
            }];
            expect(() => new GymZone(gyms)).toThrowError("All GymZone initializers must be Gym objects.");
        });
    });

    describe("fromCsvData static method", () => {
        describe("with a named zone", () => {
            it("should initialize with gyms from the zone", () => {
                let gyms = [
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                    ["Redmond", "Redmond", "Nike Park", "Nike Park", 47.683823, -122.110841, "NonEx"],
                    ["Redmond", "Redmond", "St. Jude Walking Trail", "St Judes", 47.693495, -122.116883, "NonEx"],
                    ["Redmond", "Redmond", "Redmond Meadow Park", "Meadow Park", 47.695703, -122.12655, "NonEx"],
                    ["Redmond", "Redmond", "Leaf Inlay in Sidewalk", "Leaf Inlay", 47.689362, -122.114435, "NonEx"],
                    ["Redmond", "Redmond", "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", "LDS (Hartman Park)", 47.690909, -122.110964, "NonEx"],
                    ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
                ];
                let zone = GymZone.fromCsvData(gyms, "Redmond");
                expect(zone).toBeDefined();
                expect(zone.all.length).toBe(gyms.length);
            });

            it("should throw if any gyms are not from the zone", () => {
                let gyms = [
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                    ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
                ];
                expect(() => GymZone.fromCsvData(gyms, "Redmond")).toThrowError(/does not belong to zone/);
            });

            it("should ignore gyms from other zones if ignoreOtherZones option is specified", () => {
                let gyms = [
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                    ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
                ];
                let zone = GymZone.fromCsvData(gyms, "Redmond", { ignoreOtherZones: true });
                expect(zone).toBeDefined();
                expect(zone.all.length).toBe(2);
            });

            it("should throw if there are duplicate friendly names", () => {
                let gyms = [
                    ["Bellevue|Redmond", "Bellevue", "Find shiny deals at sprint", "Sprint", 47.622703, -122.1625050, "NonEx"],
                    ["Redmond", "Redmond", "Find shiny deals at Sprint", "Sprint", 47.670882, -122.114047, "ExEligible"],
                ];
                expect(() => GymZone.fromCsvData(gyms, "Redmond")).toThrowError(/duplicate normalized friendly name/i);
            });
        });

        describe("with an unnamed zone", () => {
            it("should initialize with gyms from any zone", () => {
                let gyms = [
                    ["Bellevue", "Bellevue", "MOX Boarding House", "MOX Boarding House", 47.622703, -122.1625050, "NonEx"],
                    ["Bellevue", "Bellevue", "Magic Chandelier", "Magic Chandelier", 47.622632, -122.1628060, "NonEx"],
                    ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                    ["Redmond", "Redmond", "Nike Park", "Nike Park", 47.683823, -122.110841, "NonEx"],
                    ["Redmond", "Redmond", "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", "LDS (Hartman Park)", 47.690909, -122.110964, "NonEx"],
                    ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
                ];
                let zone = GymZone.fromCsvData(gyms);
                expect(zone).toBeDefined();
                expect(zone.all.length).toBe(gyms.length);
                expect(zone.ambiguous.length).toBe(0);
            });
        });

        it("should initialize with gyms that have duplicate official names", () => {
            let gyms = [
                ["Bellevue", "Bellevue", "Find shiny deals at sprint", "Bellevue Sprint (fake)", 47.622703, -122.1625050, "NonEx"],
                ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
                ["Woodinville", "Woodinville", "Find shiny deals at Sprint", "Woodinville Sprint", 47.758248, 122.1537780, "ExEligible"],
            ];
            let zone = GymZone.fromCsvData(gyms);
            expect(zone).toBeDefined();
            expect(zone.all.length).toBe(gyms.length);
            expect(zone.ambiguous.length).toBe(gyms.length);
        });
    });

    describe("addGym method", () => {
        it("should throw if the GymZone is already initialized", () => {
            let gyms = [
                ["Bellevue", "Bellevue", "Find shiny deals at sprint", "Bellevue Sprint (fake)", 47.622703, -122.1625050, "NonEx"],
                ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
                ["Woodinville", "Woodinville", "Find shiny deals at Sprint", "Woodinville Sprint", 47.758248, 122.1537780, "ExEligible"],
            ];
            let zone = GymZone.fromCsvData(gyms);
            let gym = Gym.fromCsvRow(["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"]);
            expect(() => zone.addGym(gym)).toThrowError(/^.*has already been initialized.*$/);
        });
    });

    describe("tryGetGyms method", () => {
        let gyms = [
            ["Bellevue", "Bellevue", "MOX Boarding House", "MOX Boarding House", 47.622703, -122.1625050, "NonEx"],
            ["Bellevue", "Bellevue", "Magic Chandelier", "Magic Chandelier", 47.622632, -122.1628060, "NonEx"],
            ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
            ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
            ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
            ["Redmond", "Redmond", "Nike Park", "Nike Park", 47.683823, -122.110841, "NonEx"],
            ["Redmond", "Redmond", "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", "LDS (Hartman Park)", 47.690909, -122.110964, "NonEx"],
            ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
            ["Bellevue", "Bellevue", "Find shiny deals at Sprint", "Bellevue Sprint (fake)", 47.622703, -122.1625050, "NonEx"],
            ["Woodinville", "Woodinville", "Find shiny deals at Sprint", "Woodinville Sprint", 47.758248, 122.1537780, "ExEligible"],
            ["Bellevue", "Lake Hills", "Starbucks", "Starbucks (Lake Hills)", 47.596722, -122.1487740, "ExEligible"],
            ["Bellevue", "Overlake", "Starbucks (Overlake)", "Starbucks", 47.628162, -122.1411100, "ExEligible"],
            ["Bellevue", "Bridle Trails", "Westminster \"W\"", "Westminster \"W\"", 47.632738, -122.1573250, "NonEx"],
        ];
        let zone = GymZone.fromCsvData(gyms);

        it("should get a score of 1.0 for a normalized exact match on friendly name or official name", () => {
            [
                { lookup: "Reservoir Park", expect: "Reservoir Park" },
                { lookup: "Mysterious Hatch", expect: "Reservoir Park" },
                { lookup: "RESERVOIR PARK", expect: "Reservoir Park" },
                { lookup: "MYSTERIOUS HATCH", expect: "Reservoir Park" },
                { lookup: "starbucks lake hills", expect: "Starbucks (Lake Hills)" },
                { lookup: "westminster w", expect: "Westminster \"W\"" },
            ].forEach((test) => {
                let found = zone.tryGetGyms(test.lookup);
                expect(found.length).toBe(1);
                expect(found[0].score).toEqual(1);
                expect(found[0].gym.friendlyName).toEqual(test.expect);
            });
        });

        it("should prefer friendly name to official name for an exact match", () => {
            let found = zone.tryGetGyms("starbucks");
            expect(found.length).toBe(1);
            expect(found[0].score).toEqual(1);
            expect(found[0].gym.officialName).toEqual("Starbucks (Overlake)");
        });

        it("should return all matches for an ambiguous official name", () => {
            let found = zone.tryGetGyms("find shiny deals at sprint");
            expect(found.length).toBe(3);
            expect(found[0].score).toEqual(1);
            expect(found[0].gym.officialName).toBe("Find shiny deals at Sprint");
            expect(found[1].score).toEqual(1);
            expect(found[1].gym.officialName).toBe("Find shiny deals at Sprint");
            expect(found[2].score).toEqual(1);
            expect(found[2].gym.officialName).toBe("Find shiny deals at Sprint");
        });

        it("should not return exact matches if noExact option is specified", () => {
            let found = zone.tryGetGyms("find shiny deals at sprint", { noExact: true });
            expect(found.length).toBe(3);
            for (let i = 0; i < found.length; i++) {
                expect(found[i].score).toBeLessThan(1);
                expect(found[i].gym.officialName).toBe("Find shiny deals at Sprint");
            }
        });

        it("should return all matches for a fuzzy match", () => {
            let found = zone.tryGetGyms("sprint");
            expect(found.length).toBe(3);
            expect(found[0].score).toBeLessThan(1);
            expect(found[0].gym.officialName).toBe("Find shiny deals at Sprint");
            expect(found[1].score).toBeLessThan(1);
            expect(found[1].gym.officialName).toBe("Find shiny deals at Sprint");
            expect(found[2].score).toBeLessThan(1);
            expect(found[2].gym.officialName).toBe("Find shiny deals at Sprint");
        });

        it("should not return fuzzy matches if noFuzzy option is specified", () => {
            let found = zone.tryGetGyms("sprint", { noFuzzy: true });
            expect(found.length).toBe(0);
        });

        it("should filter exact matches by city if supplied", () => {
            [
                { cities: ["redmond", "bellevue"], expectedCount: 2 },
                { cities: ["redmond"], expectedCount: 1 },
                { cities: ["woodinville", "redmond", "kirkland", "seattle"], expectedCount: 2 },
            ].forEach((test) => {
                let found = zone.tryGetGyms("find shiny deals at sprint", { cities: test.cities });
                expect(found.length).toBe(test.expectedCount);
                found.forEach((match) => {
                    expect(match.score).toEqual(1);
                    expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                    expect(test.cities.filter((c) => c.toLowerCase() === match.gym.city.toLowerCase()).length).toBe(1);
                });
            });
        });

        it("should return all exact matches with lower score if no supplied city matches", () => {
            let cities = ["kirkland", "seattle"];
            let baseline = zone.tryGetGyms("find shiny deals at sprint");
            let found = zone.tryGetGyms("find shiny deals at sprint", { cities: cities });

            expect(found.length).toBe(baseline.length);
            for (let i = 0; i < found.length; i++) {
                let match = found[i];
                expect(match.score).toBeLessThan(1);
                expect(match.score).toBeLessThan(baseline[i].score);
                expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                expect(cities.filter((c) => c.toLowerCase() === match.gym.city.toLowerCase()).length).toBe(0);
            }
        });

        it("should return no exact matches if no city matches and onlyMatchingCities option is supplied", () => {
            let cities = ["kirkland", "seattle"];
            let found = zone.tryGetGyms("find shiny deals at sprint", { cities: cities, onlyMatchingCities: true });
            expect(found.length).toBe(0);
        });

        it("should filter fuzzy matches by cities if supplied", () => {
            [
                { cities: ["redmond", "bellevue"], expectedCount: 2 },
                { cities: ["redmond"], expectedCount: 1 },
                { cities: ["woodinville", "redmond", "kirkland", "seattle"], expectedCount: 2 },
            ].forEach((test) => {
                let found = zone.tryGetGyms("sprint", { cities: test.cities });
                expect(found.length).toBe(test.expectedCount);
                found.forEach((match) => {
                    expect(match.score).toBeLessThan(1);
                    expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                    expect(test.cities.filter((c) => c.toLowerCase() === match.gym.city.toLowerCase()).length).toBe(1);
                });
            });
        });

        it("should return all fuzzy matches with reduced score if no supplied city matches", () => {
            let cities = ["kirkland", "seattle"];
            let baseline = zone.tryGetGyms("sprint");
            let found = zone.tryGetGyms("sprint", { cities: cities });

            expect(found.length).toBe(baseline.length);
            for (let i = 0; i < found.length; i++) {
                let match = found[i];
                expect(match.score).toBeLessThan(1);
                expect(match.score).toBeLessThan(baseline[i].score);
                expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                expect(cities.filter((c) => c.toLowerCase() === match.gym.city.toLowerCase()).length).toBe(0);
            }
        });

        it("should return no fuzzy matches if no city matches and the onlyMatchingCities option is supplied", () => {
            let cities = ["kirkland", "seattle"];
            let found = zone.tryGetGyms("sprint", { cities: cities, onlyMatchingCities: true });

            expect(found.length).toBe(0);
        });

        it("should return an empty array if no matching gym is found", () => {
            expect(zone.tryGetGyms("xyzzy").length).toBe(0);
        });
    });
});
