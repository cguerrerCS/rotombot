"use strict";

const Gym = require("../../lib/gym");

const goodGyms = [
    {
        description: "report non-ex-eligible gyms with typed or string initializers",
        csv: [
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "-122.125595", "47.673667", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "-122.125595", "47.673667", "NONEX"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "-122.125595", "47.673667", "nonex"],
            ["0123456789", ["Redmond"], "Redmond", "Cleveland Fountain", "Cleveland Fountain", -122.125595, 47.673667, false],
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
            latitude: 47.673667,
            longitude: -122.125595,
            isExEligible: false,
            mapLink: "https://www.google.com/maps/dir/?api=1&destination=47.673667,-122.125595",
        },
    },
    {
        description: "report ex-eligible gyms with typed or string initializers",
        csv: [
            ["0123456789", "Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", "-122.122394", "47.685378", "ExEligible"],
            ["0123456789", "Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", "-122.122394", "47.685378", "EXELIGIBLE"],
            ["0123456789", "Redmond", "Redmond", "Mysterious Hatch", "Reservoir Park", "-122.122394", "47.685378", "EXELIGIBLE"],
            ["0123456789", ["Redmond"], "Redmond", "Mysterious Hatch", "Reservoir Park", -122.122394, 47.685378, true],
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
            latitude: 47.685378,
            longitude: -122.122394,
            isExEligible: true,
            mapLink: "https://www.google.com/maps/dir/?api=1&destination=47.685378,-122.122394",
        },
    },
    {
        description: "handle multiple regions with typed or string parameters",
        csv: [
            ["0123456789", "Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "-122.165583", "47.666658", "NonEx"],
            ["0123456789", ["Redmond", "Kirkland"], "Rose Hill", "Tech City Bowl", "Tech City Bowl", -122.165583, 47.666658, false],
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
            latitude: 47.666658,
            longitude: -122.165583,
            isExEligible: false,
            mapLink: "https://www.google.com/maps/dir/?api=1&destination=47.666658,-122.165583",
        },
    },
    {
        description: "normalize out punctuation",
        csv: [["0123456789", "Redmond|Kirkland|Bellevue", "Houghton", "'Bogus-Gym', in Houghton.", "Houghton \"Bogus\" gym #1", "-122.165583", "47.666658", "NonEx"]],
        expected: {
            zones: ["Redmond", "Kirkland", "Bellevue"],
            city: "Houghton",
            officialName: "'Bogus-Gym', in Houghton.",
            friendlyName: "Houghton \"Bogus\" gym #1",
            normalized: {
                officialName: "bogusgyminhoughton",
                friendlyName: "houghtonbogusgym1",
            },
            latitude: 47.666658,
            longitude: -122.165583,
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
            [undefined, "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", undefined, "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", undefined, "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", undefined, "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", undefined, "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", undefined, "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", undefined, "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", undefined],
        ],
        expectedError: /^Invalid gym initializer.*$/,
    },
    {
        description: "empty mandatory fields",
        csv: [
            ["", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond",  "", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", ""],
        ],
        expectedError: /^Invalid gym initializer.*$/,
    },
    {
        description: "whitespace-only mandatory fields",
        csv: [
            ["    ", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "   ", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond",  "  ", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "    ", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "  \n", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "    ", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "   ", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "    "],
        ],
    },
    {
        description: "malformed data",
        csv: [
            ["0123456789", "Redmond|", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "|", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", {}, "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", [], "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", 100, "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", true, "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", {}, "47.673667", "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", true, "-122.125595", "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", true, "NonEx"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "notex"],
            ["0123456789", "Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "this is an ex gym"],
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

    describe("belongsToZone", () => {
        let gymSpec = ["0123456789", ["Redmond", "Kirkland", "Greater Seattle"], "Rose Hill", "Tech City Bowl", "Tech City Bowl", 47.666658, -122.165583, false];
        let gym = Gym.fromCsvRow(gymSpec);

        it("should accept a single zone as a string", () => {
            expect(gym.belongsToZone("redmond")).toBe(true);
            expect(gym.belongsToZone("kirkland")).toBe(true);
            expect(gym.belongsToZone("greaterseattle")).toBe(true);
        });

        it("should accept a several zones as an array", () => {
            expect(gym.belongsToZone(["redmond", "kirkland", "greaterseattle"])).toBe(true);
        });

        it("should normalize the specified zone or zones", () => {
            expect(gym.belongsToZone("Redmond")).toBe(true);
            expect(gym.belongsToZone("Kirkland")).toBe(true);
            expect(gym.belongsToZone("Greater Seattle")).toBe(true);
            expect(gym.belongsToZone(["Redmond", "Kirkland", "Greater Seattle"])).toBe(true);
        });
    });

    xdescribe("toString method", () => {

    });

    xdescribe("toDiscordMessage method", () => {

    });
});
