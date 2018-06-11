"use strict";

const Gym = require("../../lib/gym");

const goodGyms = [
    {
        description: "report non-ex-eligible gyms with typed or string initializers",
        csv: [
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NONEX"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "nonex"],
            [["Redmond"], "Redmond", "Cleveland Fountain", "Cleveland Fountain", 47.673667, -122.125595, false],
        ],
        expected: {
            zones: ["Redmond"],
            city: "Redmond",
            officialName: "Cleveland Fountain",
            friendlyName: "Cleveland Fountain",
            normalized: {
                officialName: "clevelandfountain",
                friendlyName: "clevelandfountain",
            },
            longitude: 47.673667,
            latitude: -122.125595,
            isExEligible: false,
            mapLink: "https://www.google.com/maps/dir/?api=1&destination=47.673667,-122.125595",
        },
    },
    {
        description: "report ex-eligible gyms with typed or string initializers",
        csv: [
            ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", "47.685378", "-122.122394", "ExEligible"],
            ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", "47.685378", "-122.122394", "EXELIGIBLE"],
            ["Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", "47.685378", "-122.122394", "EXELIGIBLE"],
            [["Redmond"], "Redmond", "Mysterious Hatch", "Reservoir Park", 47.685378, -122.122394, true],
        ],
        expected: {
            zones: ["Redmond"],
            city: "Redmond",
            officialName: "Mysterious Hatch",
            friendlyName: "Reservoir Park",
            normalized: {
                officialName: "mysterioushatch",
                friendlyName: "reservoirpark",
            },
            longitude: 47.685378,
            latitude: -122.122394,
            isExEligible: true,
            mapLink: "https://www.google.com/maps/dir/?api=1&destination=47.685378,-122.122394",
        },
    },
    {
        description: "handle multiple regions with typed or string parameters",
        csv: [
            ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
            [["Redmond", "Kirkland"], "Rose Hill", "Tech City Bowl", "Tech City Bowl", 47.666658, -122.165583, false],
        ],
        expected: {
            zones: ["Redmond", "Kirkland"],
            city: "Rose Hill",
            officialName: "Tech City Bowl",
            friendlyName: "Tech City Bowl",
            normalized: {
                officialName: "techcitybowl",
                friendlyName: "techcitybowl",
            },
            longitude: 47.666658,
            latitude: -122.165583,
            isExEligible: false,
            mapLink: "https://www.google.com/maps/dir/?api=1&destination=47.666658,-122.165583",
        },
    },
    {
        description: "normalize out punctuation",
        csv: [["Redmond|Kirkland|Bellevue", "Houghton", "'Bogus-Gym', in Houghton.", "Houghton \"Bogus\" gym #1", "47.666658", "-122.165583", "NonEx"]],
        expected: {
            zones: ["Redmond", "Kirkland", "Bellevue"],
            city: "Houghton",
            officialName: "'Bogus-Gym', in Houghton.",
            friendlyName: "Houghton \"Bogus\" gym #1",
            normalized: {
                officialName: "bogusgyminhoughton",
                friendlyName: "houghtonbogusgym1",
            },
            longitude: 47.666658,
            latitude: -122.165583,
            isExEligible: false,
            mapLink: "https://www.google.com/maps/dir/?api=1&destination=47.666658,-122.165583",
        },
    },
];

function validateGym(actual, expected) {
    expect(actual.zones).toEqual(expected.zones);
    expect(actual.city).toEqual(expected.city);
    expect(actual.officialName).toEqual(expected.officialName);
    expect(actual.normalized.officialName).toEqual(expected.normalized.officialName);
    expect(actual.friendlyName).toEqual(expected.friendlyName);
    expect(actual.normalized.friendlyName).toEqual(expected.normalized.friendlyName);
    expect(actual.longitude).toBe(expected.longitude);
    expect(actual.latitude).toBe(expected.latitude);
    expect(actual.isExEligible).toBe(expected.isExEligible);
    expect(actual.mapLink).toBe(expected.mapLink);
}

const badGyms = [
    {
        description: "undefined mandatory fields",
        csv: [
            [undefined, "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", undefined, "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", undefined, "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", undefined, "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", undefined, "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", undefined, "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", undefined],
        ],
        expectedError: /^Invalid gym initializer.*$/,
    },
    {
        description: "empty mandatory fields",
        csv: [
            ["", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond",  "", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", ""],
        ],
        expectedError: /^Invalid gym initializer.*$/,
    },
    {
        description: "whitespace-only mandatory fields",
        csv: [
            ["   ", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond",  "  ", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "    ", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "  \n", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "    ", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "   ", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "    "],
        ],
    },
    {
        description: "malformed data",
        csv: [
            ["Redmond|", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["|", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            [{}, "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            [[], "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", 100, "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", true, "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", {}, "47.673667", "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", true, "-122.125595", "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", true, "NonEx"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "notex"],
            ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "this is an ex gym"],
        ],
    },
];

describe("Gym object", () => {
    describe("fromCsvRow", () => {
        describe("with valid gyms", () => {
            goodGyms.forEach((gymSpec) => {
                it(`should ${gymSpec.description}`, () => {
                    gymSpec.csv.forEach((csv) => {
                        let gym = Gym.fromCsvRow(csv);
                        validateGym(gym, gymSpec.expected);
                    });
                });
            });
        });

        describe("with invalid gyms", () => {
            badGyms.forEach((gymSpec) => {
                it(`should throw on ${gymSpec.description}`, () => {
                    gymSpec.csv.forEach((csv) => {
                        expect(() => Gym.fromCsvRow(csv)).toThrowError(gymSpec.expectedError);
                    });
                });
            });
        });
    });

    describe("normalizeNames", () => {
        it("should normalize all names in an array", () => {
            expect(Gym.normalizeNames(["BLAH", "Some name with spaces and punctuation!", "this-is-a-test"])).toEqual([
                "blah", "somenamewithspacesandpunctuation", "thisisatest",
            ]);
        });

        it("should throw if any names are empty", () => {
            expect(() => Gym.normalizeNames(["BLAH", "    "])).toThrowError("Cannot normalize an empty name.")
        });
    });
});
