"use strict";

const Gym = require("../../lib/gym");

const goodGyms = [
    {
        csv: ["Redmond", "Redmond", "Cleveland Fountain", "Cleveland Fountain", "47.673667", "-122.125595", "NonEx"],
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

describe("Gym object", () => {
    describe("fromCsvRecord", () => {
        it("should construct valid gyms", () => {
            goodGyms.forEach((gymSpec) => {
                let gym = Gym.fromCsvRecord(gymSpec.csv);
                validateGym(gym, gymSpec.expected);
            });
        });
    });
});
