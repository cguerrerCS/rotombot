"use strict";

const Gym = require("../../lib/gym");
const GymDirectory = require("../../lib/gymDirectory");

describe("GymDirectory object", () => {
    describe("constructor", () => {
        it("should throw if gyms initializer is not an array with at least one element", () => {
            expect(() => new GymDirectory({})).toThrowError("GymDirectory initializer must be an array with at least one element.");
            expect(() => new GymDirectory([])).toThrowError("GymDirectory initializer must be an array with at least one element.");
        });

        it("should throw if gyms initializer contains non-Gym objects", () => {
            let gymSpecs = [{
                zones: ["Redmond", "Kirkland", "Bellevue"],
                city: "Houghton",
                officialName: "'Bogus-Gym', in Houghton.",
                friendlyName: "Houghton \"Bogus\" gym #1",
                longitude: 47.666658,
                latitude: -122.165583,
                isExEligible: false,
            }];
            expect(() => new GymDirectory(gymSpecs)).toThrowError("All GymDirectory initializers must be Gym objects.");
        });

        it("should throw if an unknown init option is supplied", () => {
            let gymSpecs = [
                ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
            ];
            let options = {
                bogusOption: "some value",
                throwfornonallowedzones: true,
            };
            expect(() => new GymDirectory(gymSpecs, options)).toThrowError(/unknown init option/i);
        });

        it("should throw if an init option is the wrong type", () => {
            let gymSpecs = [
                ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
            ];
            [
                { options: { requiredCities: "redmond" }, expectedError: /must be an array/i },
                { options: { throwForNonAllowedZones: 1 }, expectedError: /found number/i },
                { options: { throwForNonAllowedZones: [true] } },
            ].forEach((test) => {
                expect(() => new GymDirectory(gymSpecs, test.options)).toThrowError(test.expectedError);
            });
        });
    });

    describe("fromCsvData static method", () => {
        describe("with gyms from required zones or cities", () => {
            it("should initialize with only gyms from the allowed zones or cities", () => {
                let gymSpecs = [
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                    ["Redmond", "Redmond", "Nike Park", "Nike Park", 47.683823, -122.110841, "NonEx"],
                    ["Redmond", "Redmond", "St. Jude Walking Trail", "St Judes", 47.693495, -122.116883, "NonEx"],
                    ["Redmond", "Redmond", "Redmond Meadow Park", "Meadow Park", 47.695703, -122.12655, "NonEx"],
                    ["Redmond", "Redmond", "Leaf Inlay in Sidewalk", "Leaf Inlay", 47.689362, -122.114435, "NonEx"],
                    ["Redmond", "Redmond", "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", "LDS (Hartman Park)", 47.690909, -122.110964, "NonEx"],
                    ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
                ];
                [
                    { allowedZones: ["redmond"] },
                    { allowedCities: ["redmond", "rosehill"] },
                    { allowedZones: ["redmond"], allowedCities: ["redmond", "rosehill"] },
                ].forEach((options) => {
                    let gyms = GymDirectory.fromCsvData(gymSpecs, options);
                    expect(gyms).toBeDefined();
                    expect(gyms.all.length).toBe(gymSpecs.length);
                });
            });

            it("should normalize zone and city names", () => {
                let gymSpecs = [
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                ];
                let options = {
                    allowedZones: ["Redmond", "Kirkland"],
                    allowedCities: ["Redmond", "Rose Hill", "Education Hill"],
                    preferredZones: ["Redmond"],
                    preferredCities: ["Redmond"],
                };
                let gyms = GymDirectory.fromCsvData(gymSpecs, options);
                [
                    { init: options.allowedZones, value: gyms.options.allowedZones },
                    { init: options.allowedCities, value: gyms.options.allowedCities },
                    { init: options.preferredZones, value: gyms.options.preferredZones },
                    { init: options.preferredCities, value: gyms.options.preferredCities },
                ].forEach((test) => {
                    expect(test.init.length).toBe(test.value.length);
                    for (let i = 0; i < test.init.length; i++) {
                        // normalized value should be lower case and have no non-word characters
                        expect(test.init[i]).not.toEqual(test.value[i]);
                        expect(test.value[i].toLowerCase()).toBe(test.value[i]);
                        expect(test.value[i].replace(/[\W]/g)).toBe(test.value[i]);
                    }
                });
            });

            it("should throw if any gyms are not from an allowed zone or city if throwForNonAllowed is true", () => {
                let gymSpecs = [
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                    ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
                ];
                [
                    { options: { allowedZones: ["redmond"], throwForNonAllowedZones: true } },
                    { options: { allowedCities: ["redmond", "rosehill"], throwForNonAllowedCities: true } },
                ].forEach((test) => {
                    expect(() => GymDirectory.fromCsvData(gymSpecs, test.options)).toThrowError(/is not in one of the required/);
                });
            });

            it("should ignore gyms from non-allowed zones or cities if throwForNonAllowed is not true", () => {
                let gymSpecs = [
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                    ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
                ];
                [
                    { options: { allowedZones: ["Redmond"], throwForNonAllowedZones: false }, expectedLength: 2 },
                    { options: { allowedCities: ["Rose Hill", "Lake Hills"], throwForNonAllowedCities: false }, expectedLength: 2 },
                ].forEach((test) => {
                    let gyms = GymDirectory.fromCsvData(gymSpecs, test.options);
                    expect(gyms).toBeDefined();
                    expect(gyms.all.length).toBe(test.expectedLength);
                });
            });
        });

        describe("with allowed zones and cities not specified", () => {
            it("should initialize with gyms from any zone or city", () => {
                let gymSpecs = [
                    ["Bellevue", "Bellevue", "MOX Boarding House", "MOX Boarding House", 47.622703, -122.1625050, "NonEx"],
                    ["Bellevue", "Bellevue", "Magic Chandelier", "Magic Chandelier", 47.622632, -122.1628060, "NonEx"],
                    ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
                    ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
                    ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
                    ["Redmond", "Redmond", "Nike Park", "Nike Park", 47.683823, -122.110841, "NonEx"],
                    ["Redmond", "Redmond", "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", "LDS (Hartman Park)", 47.690909, -122.110964, "NonEx"],
                    ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
                ];
                let gyms = GymDirectory.fromCsvData(gymSpecs);
                expect(gyms).toBeDefined();
                expect(gyms.all.length).toBe(gymSpecs.length);
                expect(gyms.ambiguous.length).toBe(0);
            });
        });

        it("should throw if there are duplicate friendly names", () => {
            let gymSpecs = [
                ["Bellevue|Redmond", "Bellevue", "Find shiny deals at sprint", "Sprint", 47.622703, -122.1625050, "NonEx"],
                ["Redmond", "Redmond", "Find shiny deals at Sprint", "Sprint", 47.670882, -122.114047, "ExEligible"],
            ];
            expect(() => GymDirectory.fromCsvData(gymSpecs)).toThrowError(/duplicate normalized friendly name/i);
        });

        it("should initialize with gyms that have duplicate official names", () => {
            let gymSpecs = [
                ["Bellevue", "Bellevue", "Find shiny deals at sprint", "Bellevue Sprint (fake)", 47.622703, -122.1625050, "NonEx"],
                ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
                ["Woodinville", "Woodinville", "Find shiny deals at Sprint", "Woodinville Sprint", 47.758248, 122.1537780, "ExEligible"],
            ];
            let gyms = GymDirectory.fromCsvData(gymSpecs);
            expect(gyms).toBeDefined();
            expect(gyms.all.length).toBe(gymSpecs.length);
            expect(gyms.ambiguous.length).toBe(gymSpecs.length);
        });
    });

    describe("addGym method", () => {
        it("should not throw if the GymDirectory is already initialized", () => {
            let gymSpecs = [
                ["Bellevue", "Bellevue", "Find shiny deals at sprint", "Bellevue Sprint (fake)", 47.622703, -122.1625050, "NonEx"],
                ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint", 47.670882, -122.114047, "ExEligible"],
                ["Woodinville", "Woodinville", "Find shiny deals at Sprint", "Woodinville Sprint", 47.758248, 122.1537780, "ExEligible"],
            ];
            let gyms = GymDirectory.fromCsvData(gymSpecs);
            let gym = Gym.fromCsvRow(["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"]);
            expect(() => gyms.addGym(gym)).not.toThrowError();
        });
    });

    describe("tryGetGyms method", () => {
        let gymSpecs = [
            ["Bellevue", "Bellevue", "MOX Boarding House", "MOX Boarding House", 47.622703, -122.1625050, "NonEx"],
            ["Bellevue", "Bellevue", "Magic Chandelier", "Magic Chandelier", 47.622632, -122.1628060, "NonEx"],
            ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
            ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
            ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
            ["Redmond", "Redmond", "Nike Park", "Nike Park", 47.683823, -122.110841, "NonEx"],
            ["Redmond", "Redmond", "The Church Of Jesus Christ Of Latter-Day Saints (Hartman Park)", "LDS (Hartman Park)", 47.690909, -122.110964, "NonEx"],
            ["Redmond", "Redmond", "Find shiny deals at Sprint", "Redmond Sprint (defunct)", 47.670882, -122.114047, "ExEligible"],
            ["Bellevue|Redmond", "Bellevue", "Find shiny deals at Sprint", "Bellevue Sprint (imaginary)", 47.622703, -122.1625050, "NonEx"],
            ["Woodinville", "Woodinville", "Find shiny deals at Sprint", "Woodinville Sprint", 47.758248, 122.1537780, "ExEligible"],
            ["Bellevue", "Lake Hills", "Starbucks", "Starbucks (Lake Hills)", 47.596722, -122.1487740, "ExEligible"],
            ["Bellevue", "Overlake", "Starbucks", "Ezell's Starbucks", 47.625049, 122.155033, "ExEligible"],
            ["Bellevue", "Overlake", "Starbucks (Overlake)", "Starbucks", 47.628162, -122.1411100, "ExEligible"],
            ["Bellevue", "Bridle Trails", "Westminster \"W\"", "Westminster \"W\"", 47.632738, -122.1573250, "NonEx"],
        ];
        let gyms = GymDirectory.fromCsvData(gymSpecs);

        it("should get a score of 1.0 for a normalized exact match on friendly name or official name", () => {
            [
                { lookup: "Reservoir Park", expect: "Reservoir Park" },
                { lookup: "Mysterious Hatch", expect: "Reservoir Park" },
                { lookup: "RESERVOIR PARK", expect: "Reservoir Park" },
                { lookup: "MYSTERIOUS HATCH", expect: "Reservoir Park" },
                { lookup: "starbucks lake hills", expect: "Starbucks (Lake Hills)" },
                { lookup: "westminster w", expect: "Westminster \"W\"" },
            ].forEach((test) => {
                let found = gyms.tryGetGyms(test.lookup);
                expect(found.length).toBe(1);
                expect(found[0].score).toEqual(1);
                expect(found[0].gym.friendlyName).toEqual(test.expect);
            });
        });

        it("should prefer friendly name to official name for an exact match", () => {
            let found = gyms.tryGetGyms("starbucks");
            expect(found.length).toBe(1);
            expect(found[0].score).toEqual(1);
            expect(found[0].gym.officialName).toEqual("Starbucks (Overlake)");
        });

        it("should return all matches for an ambiguous official name", () => {
            let found = gyms.tryGetGyms("find shiny deals at sprint");
            expect(found.length).toBe(3);
            expect(found[0].score).toEqual(1);
            expect(found[0].gym.officialName).toBe("Find shiny deals at Sprint");
            expect(found[1].score).toEqual(1);
            expect(found[1].gym.officialName).toBe("Find shiny deals at Sprint");
            expect(found[2].score).toEqual(1);
            expect(found[2].gym.officialName).toBe("Find shiny deals at Sprint");
        });

        it("should not return exact matches if noExact option is specified", () => {
            let found = gyms.tryGetGyms("find shiny deals at sprint", { noExact: true });
            expect(found.length).toBe(3);
            for (let i = 0; i < found.length; i++) {
                expect(found[i].score).toBeLessThan(1);
                expect(found[i].gym.officialName).toBe("Find shiny deals at Sprint");
            }
        });

        it("should return all matches for a fuzzy match", () => {
            let found = gyms.tryGetGyms("sprint");
            expect(found.length).toBe(3);
            expect(found[0].score).toBeLessThan(1);
            expect(found[0].gym.officialName).toBe("Find shiny deals at Sprint");
            expect(found[1].score).toBeLessThan(1);
            expect(found[1].gym.officialName).toBe("Find shiny deals at Sprint");
            expect(found[2].score).toBeLessThan(1);
            expect(found[2].gym.officialName).toBe("Find shiny deals at Sprint");
        });

        it("should not return fuzzy matches if noFuzzy option is specified", () => {
            let found = gyms.tryGetGyms("sprint", { noFuzzy: true });
            expect(found.length).toBe(0);
        });

        describe("with preferred or required zones", () => {
            it("should filter exact matches by preferred zone", () => {
                [
                    { zones: ["redmond", "bellevue"], expectedCount: 2 },
                    { zones: ["redmond"], expectedCount: 2 },
                    { zones: ["woodinville", "redmond", "kirkland", "seattle"], expectedCount: 3 },
                ].forEach((test) => {
                    let found = gyms.tryGetGyms("find shiny deals at sprint", { preferredZones: test.zones });
                    expect(found.length).toBe(test.expectedCount);
                    found.forEach((match) => {
                        expect(match.score).toEqual(1);
                        expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                    });
                });
            });

            it("should return all exact matches with lower score if no preferred zone matches", () => {
                let zones = ["kirkland", "seattle"];
                let baseline = gyms.tryGetGyms("find shiny deals at sprint");
                let found = gyms.tryGetGyms("find shiny deals at sprint", { preferredZones: zones });

                expect(found.length).toBe(baseline.length);
                for (let i = 0; i < found.length; i++) {
                    let match = found[i];
                    expect(match.score).toBeLessThan(1);
                    expect(match.score).toBeLessThan(baseline[i].score);
                    expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                }
            });

            it("should filter fuzzy matches by preferred zones", () => {
                [
                    { zones: ["redmond", "bellevue"], expectedCount: 2 },
                    { zones: ["redmond"], expectedCount: 2 },
                    { zones: ["woodinville", "redmond", "kirkland", "seattle"], expectedCount: 3 },
                ].forEach((test) => {
                    let found = gyms.tryGetGyms("sprint", { preferredZones: test.zones });
                    expect(found.length).toBe(test.expectedCount);
                    found.forEach((match) => {
                        expect(match.score).toBeLessThan(1);
                        expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                    });
                });
            });

            it("should return all fuzzy matches with reduced score if no preferred zone matches", () => {
                let zones = ["kirkland", "seattle"];
                let baseline = gyms.tryGetGyms("sprint");
                let found = gyms.tryGetGyms("sprint", { preferredZones: zones });

                expect(found.length).toBe(baseline.length);
                for (let i = 0; i < found.length; i++) {
                    let match = found[i];
                    expect(match.score).toBeLessThan(1);
                    expect(match.score).toBeLessThan(baseline[i].score);
                    expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                }
            });

            it("should return no exact matches if no required zone matches", () => {
                let zones = ["kirkland", "seattle"];
                let found = gyms.tryGetGyms("find shiny deals at sprint", { requiredZones: zones });
                expect(found.length).toBe(0);
            });

            it("should return no fuzzy matches if no required zone matches", () => {
                let zones = ["kirkland", "seattle"];
                let found = gyms.tryGetGyms("sprint", { requiredZones: zones });
                expect(found.length).toBe(0);
            });
        });

        describe("with preferred or required cities", () => {
            it("should filter exact matches by preferred city", () => {
                [
                    { cities: ["redmond", "bellevue"], expectedCount: 2 },
                    { cities: ["redmond"], expectedCount: 1 },
                    { cities: ["woodinville", "redmond", "kirkland", "seattle"], expectedCount: 2 },
                ].forEach((test) => {
                    let found = gyms.tryGetGyms("find shiny deals at sprint", { preferredCities: test.cities });
                    expect(found.length).toBe(test.expectedCount);
                    found.forEach((match) => {
                        expect(match.score).toEqual(1);
                        expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                    });
                });
            });

            it("should return all exact matches with lower score if no preferred city matches", () => {
                let cities = ["kirkland", "seattle"];
                let baseline = gyms.tryGetGyms("find shiny deals at sprint");
                let found = gyms.tryGetGyms("find shiny deals at sprint", { preferredCities: cities });

                expect(found.length).toBe(baseline.length);
                for (let i = 0; i < found.length; i++) {
                    let match = found[i];
                    expect(match.score).toBeLessThan(1);
                    expect(match.score).toBeLessThan(baseline[i].score);
                    expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                }
            });

            it("should filter fuzzy matches by preferred cities", () => {
                [
                    { cities: ["redmond", "bellevue"], expectedCount: 2 },
                    { cities: ["redmond"], expectedCount: 1 },
                    { cities: ["woodinville", "redmond", "kirkland", "seattle"], expectedCount: 2 },
                ].forEach((test) => {
                    let found = gyms.tryGetGyms("sprint", { preferredCities: test.cities });
                    expect(found.length).toBe(test.expectedCount);
                    found.forEach((match) => {
                        expect(match.score).toBeLessThan(1);
                        expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                    });
                });
            });

            it("should return all fuzzy matches with reduced score if no preferred city matches", () => {
                let cities = ["kirkland", "seattle"];
                let baseline = gyms.tryGetGyms("sprint");
                let found = gyms.tryGetGyms("sprint", { preferredCities: cities });

                expect(found.length).toBe(baseline.length);
                for (let i = 0; i < found.length; i++) {
                    let match = found[i];
                    expect(match.score).toBeLessThan(1);
                    expect(match.score).toBeLessThan(baseline[i].score);
                    expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                }
            });

            it("should return no exact matches if no required city matches", () => {
                let cities = ["kirkland", "seattle"];
                let found = gyms.tryGetGyms("find shiny deals at sprint", { requiredCities: cities });
                expect(found.length).toBe(0);
            });

            it("should return no fuzzy matches if no required city matches", () => {
                let cities = ["kirkland", "seattle"];
                let found = gyms.tryGetGyms("sprint", { requiredCities: cities });
                expect(found.length).toBe(0);
            });
        });

        describe("with preferred or required cities and zones", () => {
            it("should filter exact matches by preferred city and zone", () => {
                [
                    { zones: ["redmond"], cities: ["redmond", "bellevue"], expectedCount: 2 },
                    { zones: ["redmond"], cities: ["bellevue"], expectedCount: 1 },
                    { zones: ["redmond"], cities: ["woodinville", "redmond", "kirkland", "seattle"], expectedCount: 1 },
                ].forEach((test) => {
                    let found = gyms.tryGetGyms("find shiny deals at sprint", { preferredZones: test.zones, preferredCities: test.cities });
                    expect(found.length).toBe(test.expectedCount);
                    found.forEach((match) => {
                        expect(match.score).toEqual(1);
                        expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                    });
                });
            });

            it("should return all exact matches with lower score if no preferred city or zone matches", () => {
                let cities = ["kirkland", "seattle"];
                let zones = ["everett"];
                let baseline = gyms.tryGetGyms("find shiny deals at sprint");
                let found = gyms.tryGetGyms("find shiny deals at sprint", { preferredZones: zones, preferredCities: cities });

                expect(found.length).toBe(baseline.length);
                for (let i = 0; i < found.length; i++) {
                    let match = found[i];
                    expect(match.score).toBeLessThan(1);
                    expect(match.score).toBeLessThan(baseline[i].score);
                    expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                }
            });

            it("should filter fuzzy matches by preferred cities or zones, with preference to city", () => {
                [
                    { zones: ["woodinville"], cities: ["redmond", "bellevue"], expectedCount: 2 },
                    { zones: ["woodinville"], cities: ["seattle"], expectedCount: 1 },
                ].forEach((test) => {
                    let baseline = gyms.tryGetGyms("sprint");
                    let found = gyms.tryGetGyms("sprint", { preferredZones: test.zones, preferredCities: test.cities });

                    expect(found.length).toBe(test.expectedCount);
                    found.forEach((match) => {
                        let baseMatch = baseline.filter((c) => c.gym.normalized.friendlyName === match.gym.normalized.friendlyName)[0];
                        expect(match.score).toBeLessThan(1);
                        expect(match.score).toBeLessThan(baseMatch.score);
                        expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                    });
                });
            });

            it("should return all fuzzy matches with reduced score if no preferred city or zone matches", () => {
                let zones = ["tacoma"];
                let cities = ["kirkland", "seattle"];
                let baseline = gyms.tryGetGyms("sprint");
                let found = gyms.tryGetGyms("sprint", { preferredZones: zones, preferredCities: cities });

                expect(found.length).toBe(baseline.length);
                for (let i = 0; i < found.length; i++) {
                    let match = found[i];
                    expect(match.score).toBeLessThan(1);
                    expect(match.score).toBeLessThan(baseline[i].score);
                    expect(match.gym.officialName).toBe("Find shiny deals at Sprint");
                }
            });
        });

        it("should return an empty array if no matching gym is found", () => {
            expect(gyms.tryGetGyms("xyzzy").length).toBe(0);
        });
    });

    describe("getOption method", function () {
        let gymSpecs = [
            ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
            ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, "ExEligible"],
            ["Bellevue", "Lake Hills", "The Church Of Jesus Christ Of Latter-Day Saints (Lake Hills)", "LDS (Lake Hills)", 47.584283, -122.141151, "NonEx"],
        ];
        let options = {
            allowedZones: ["redmond", "bellevue", "seattle"],
            allowedCities: ["redmond", "rosehill", "lakehills"],
            preferredCities: ["redmond"],
        };
        let gyms = GymDirectory.fromCsvData(gymSpecs, options);

        it("should get an option from the gym directory if no override is specified", () => {
            expect(gyms.getOption("allowedZones")).toEqual(options.allowedZones);
            expect(gyms.getOption("allowedCities")).toEqual(options.allowedCities);
            expect(gyms.getOption("preferredCities")).toEqual(options.preferredCities);
            expect(gyms.getOption("throwForNonAllowedZones")).toBe(false);
        });

        it("should get an option from the override if specified", () => {
            const overrides = {
                preferredCities: ["lakehills"],
            };
            expect(gyms.getOption("allowedZones", overrides)).toEqual(options.allowedZones);
            expect(gyms.getOption("allowedCities", overrides)).toEqual(options.allowedCities);
            expect(gyms.getOption("preferredCities", overrides)).toEqual(overrides.preferredCities);
            expect(gyms.getOption("throwForNonAllowedZones", overrides)).toBe(false);
        });

        it("should throw for an unknown option", () => {
            expect(() => gyms.getOption("blargle")).toThrowError(/unknown option/i);
        });
    });
});
