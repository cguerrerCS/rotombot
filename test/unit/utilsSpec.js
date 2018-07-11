"use strict";

const Utils = require("../../lib/utils");

describe("Utils module", () => {
    describe("normalize", () => {
        it("should normalize a string", () => {
            expect(Utils.normalize("Some String")).toBe("somestring");
        });

        it("should throw for an empty string", () => {
            expect(() => Utils.normalize("   ")).toThrowError("Cannot normalize an empty string.");
        });

        it("should throw for anything but string or array", () => {
            [
                {}, true, 11, undefined, null, () => true,
            ].forEach((badParam) => {
                expect(() => Utils.normalize(badParam)).toThrowError(/cannot normalize an input of type/i);
            });
        });

        it("should normalize all strings in an array", () => {
            expect(Utils.normalize(["BLAH", "Some name with spaces and punctuation!", "this-is-a-test"])).toEqual([
                "blah", "somenamewithspacesandpunctuation", "thisisatest",
            ]);
        });

        it("should throw if any strings are empty", () => {
            expect(() => Utils.normalize(["BLAH", "    "])).toThrowError("Cannot normalize an empty string.");
        });
    });

    xdescribe("extract static method", () => {

    });

    xdescribe("forOwn static method", () => {

    });

    xdescribe("validateDiscordEmbed static method", () => {

    });

    xdescribe("mergeOptions static method", () => {

    });

    xdescribe("NormalizedMap class", () => {

    });
});
