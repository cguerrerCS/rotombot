"use strict";

const GymZone = require("../../lib/gymZone");

describe("GymZone object", () => {
    describe("fromCsvData method", () => {
        it("should initialize a zone with no ambiguous gyms", () => {
            let gyms = [
                ["Redmond|Kirkland", "Rose Hill", "Tech City Bowl", "Tech City Bowl", "47.666658", "-122.165583", "NonEx"],
            ];
            let zone = GymZone.fromCsvData("Redmond", gyms);
            expect(zone).toBeDefined();
            expect(zone.all.length).toBe(gyms.length);
        });
    });
});
