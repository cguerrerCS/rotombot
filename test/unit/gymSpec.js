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
            officialName: {
                display: "Cleveland Fountain",
                normalized: "clevelandfountain",
            },
            friendlyName: {
                display: "Cleveland Fountain",
                normalized: "clevelandfountain",
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
            officialName: {
                display: "Mysterious Hatch",
                normalized: "mysterioushatch",
            },
            friendlyName: {
                display: "Reservoir Park",
                normalized: "reservoirpark",
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
            officialName: {
                display: "Tech City Bowl",
                normalized: "techcitybowl",
            },
            friendlyName: {
                display: "Tech City Bowl",
                normalized: "techcitybowl",
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
            officialName: {
                display: "'Bogus-Gym', in Houghton.",
                normalized: "bogusgyminhoughton",
            },
            friendlyName: {
                display: "Houghton \"Bogus\" gym #1",
                normalized: "houghtonbogusgym1",
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
    expect(actual.officialName.display).toEqual(expected.officialName.display);
    expect(actual.officialName.normalized).toEqual(expected.officialName.normalized);
    expect(actual.friendlyName.display).toEqual(expected.friendlyName.display);
    expect(actual.friendlyName.normalized).toEqual(expected.friendlyName.normalized);
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
    describe("fromCsvRecord", () => {
        describe("with valid gyms", () => {
            goodGyms.forEach((gymSpec) => {
                it(`should ${gymSpec.description}`, () => {
                    gymSpec.csv.forEach((csv) => {
                        let gym = Gym.fromCsvRecord(csv);
                        validateGym(gym, gymSpec.expected);
                    });
                });
            });
        });

        describe("with invalid gyms", () => {
            badGyms.forEach((gymSpec) => {
                it(`should throw on ${gymSpec.description}`, () => {
                    gymSpec.csv.forEach((csv) => {
                        expect(() => Gym.fromCsvRecord(csv)).toThrowError(gymSpec.expectedError);
                    });
                });
            });
        });
    });
});
