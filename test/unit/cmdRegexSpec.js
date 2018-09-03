"use strict";

let regex = require("../../lib/cmdRegex");

describe("cmdRegexHelper", () => {
    it("should not regress the !add egg by start time command", () => {
        // const addEggByStartTimeRegex = /^!add\s+(?:(?:L|T|l|t)?(\d+)\s+)?(\w+(?:\s|\w|'|-)*)(?:\s+(?:@|at)\s*)((?:\d?\d):?(?:\d\d)\s*(?:a|A|am|AM|p|P|pm|PM)?)$/;
        let cmd = regex.create(["!add", "[tier]", "[gym]", "(?:@|at)", "[timeOfDay]"]);
        [
            { str: "!add Hoity-toity at 1100p", tier: undefined, gym: "Hoity-toity", time: "1100p" },
            { str: "!add T3 Blah Blah at 1030", tier: "3", gym: "Blah Blah", time: "1030" },
            { str: "!add Blah Blah at 10:30 AM", tier: undefined, gym: "Blah Blah", time: "10:30 AM" },
            { str: "!add T1 St. Jude's at 22:30", tier: "1", gym: "St. Jude's", time: "22:30" },
        ].forEach((test) => {
            let match = test.str.match(cmd);
            expect(match).not.toBeNull();
            expect(match[1]).toEqual(test.tier);
            expect(match[2]).toBe(test.gym);
            expect(match[3]).toBe(test.time);
        });
    });
});
