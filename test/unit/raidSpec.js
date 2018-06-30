"use strict";

const { FlexTime } = require("botsbits");

const Utils = require("../../lib/utils");

const Raid = require("../../lib/raid");

describe("Raid module", () => {
    describe("_validateTier static method", () => {
        it("should accept numbers in range and well-formatted strings", () => {
            [
                [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], ["1", 1], ["2", 2], ["3", 3], ["4", 4], ["5", 5], ["Tier 1", 1], ["Tier 2", 2], ["Tier 3", 3], ["Tier 4", 4], ["Tier 5", 5],
            ].forEach((test) => {
                expect(Raid._validateTier(test[0])).toBe(test[1]);
            });
        });

        it("should default to tier 5 for undefined tier request", () => {
            expect(Raid._validateTier()).toBe(5);
        });

        it("should reject numbers out of range, poorly formatted strings, and objects", () => {
            [
                -1, 0, 6, "-100", "600", "Tier 7", "tier 1", "L1", "blah-di-blah", {}, /Tier 1/,
            ].forEach((v) => {
                expect(() => Raid._validateTier(v)).toThrow();
            });
        });
    });

    describe("validateHatchTime static method", () => {
        it("should accept valid times", () => {
            [1, 10, 59].forEach((minutes) => {
                let date = Utils.getDeltaFromNow(minutes);
                let time = new FlexTime(date);
                let validTime = Raid.validateHatchTime(time.toString());
                expect(validTime.getHours()).toBe(time.getHours());
                expect(validTime.getMinutes()).toBe(time.getMinutes());
            });
        });

        it("should reject invalid times", () => {
            [-2, 65].forEach((minutes) => {
                let date = Utils.getDeltaFromNow(minutes);
                let time = new FlexTime(date);
                expect(() => Raid.validateHatchTime(time.toString())).toThrow();
            });
        });
    });

    describe("validateEggTimer static method", () => {
        it("should accept valid numbers and strings in range", () => {
            [
                1, 10, 30, 45, 60, "15", "30", "50",
            ].forEach((v) => {
                expect(Raid.validateEggTimer(v)).toBe(Number(v));
            });
        });

        it("should reject out of range numbers/strings or anything other type", () => {
            [
                -15, 0, 61, 1000, "-5", "65", {}, /\d\d/,
            ].forEach((v) => {
                expect(() => Raid.validateEggTimer(v)).toThrow();
            });
        });
    });

    describe("validateRaidTimer static method", () => {
        it("should accept valid numbers and strings in range", () => {
            [
                1, 10, 30, 45, "15", "30", "40",
            ].forEach((v) => {
                expect(Raid.validateRaidTimer(v)).toBe(Number(v));
            });
        });

        it("should reject out of range numbers/strings or anything other type", () => {
            [
                -15, 0, 46, 1000, "-1", "60", {}, /\d\d/,
            ].forEach((v) => {
                expect(() => Raid.validateRaidTimer(v)).toThrow();
            });
        });
    });
});
