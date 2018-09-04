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

    it("should not regress the !add egg by timer command", () => {
        // const addEggByTimerRegex = /^!add\s+(?:(?:L|T|l|t)?(\d+)\s+)?(\w+(?:\s|\w|'|-)*)(?:\s+(?:in)\s*)(\d?\d)\s*?$/i;
        let cmd = regex.create(["!add", "[tier]", "[gym]", "in", "[timer]"]);
        [
            { str: "!add Hoity-toity in 10", tier: undefined, gym: "Hoity-toity", timer: "10" },
            { str: "!add T3 Blah Blah in 5", tier: "3", gym: "Blah Blah", timer: "5" },
            { str: "!add T1 St. Jude's in 55", tier: "1", gym: "St. Jude's", timer: "55" },
        ].forEach((test) => {
            let match = test.str.match(cmd);
            expect(match).not.toBeNull();
            expect(match[1]).toEqual(test.tier);
            expect(match[2]).toBe(test.gym);
            expect(match[3]).toBe(test.timer);
        });
    });

    it("should not regress the !add boss with timer command", () => {
        // const addBossWithTimerRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s|'|-)*)(?:\s+(\d?\d)\s*(?:left))\s*?$/i;
        let cmd = regex.create(["!add", "[boss]", "(?:@|at)", "[gym]", "[timer]", "left"]);
        [
            { str: "!add Boss at Hoity-toity 10 left", boss: "Boss", gym: "Hoity-toity", timer: "10" },
            { str: "!add Who @ Blah Blah 5 left", boss: "Who", gym: "Blah Blah", timer: "5" },
            { str: "!add Ho-oh at St. Jude's 55 left", boss: "Ho-oh", gym: "St. Jude's", timer: "55" },
        ].forEach((test) => {
            let match = test.str.match(cmd);
            expect(match).not.toBeNull();
            expect(match[1]).toEqual(test.boss);
            expect(match[2]).toBe(test.gym);
            expect(match[3]).toBe(test.timer);
        });
    });

    it("should not regress the alternate !add boss with timer command", () => {
        // const addBossWithTimerAltRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s|`|-)*)(?:for)(?:\s+(\d?\d)\s*)\s*?$/i;
        let cmd = regex.create(["!add", "[boss]", "(?:@|at)", "[gym]", "for", "[timer]"]);
        [
            { str: "!add Ho-oh @ Hoity-toity for 10", boss: "Ho-oh", gym: "Hoity-toity", timer: "10" },
            { str: "!add Who at Blah Blah for 5", boss: "Who", gym: "Blah Blah", timer: "5" },
            { str: "!add Ho-oh at St. Jude's for 55", boss: "Ho-oh", gym: "St. Jude's", timer: "55" },
        ].forEach((test) => {
            let match = test.str.match(cmd);
            expect(match).not.toBeNull();
            expect(match[1]).toEqual(test.boss);
            expect(match[2]).toBe(test.gym);
            expect(match[3]).toBe(test.timer);
        });
    });

    
    it("should not regress the alternate !add boss without  timer command", () => {
        // const addBossNoTimerRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s|`|-)*)$/i;
        let cmd = regex.create(["!add", "[boss]", "(?:@|at)", "[gym]"]);
        [
            { str: "!add Ho-oh at Hoity-toity", boss: "Ho-oh", gym: "Hoity-toity" },
            { str: "!add Who at Blah Blah", boss: "Who", gym: "Blah Blah" },
            { str: "!add Ho-oh @ St. Jude's", boss: "Ho-oh", gym: "St. Jude's" },
        ].forEach((test) => {
            let match = test.str.match(cmd);
            expect(match).not.toBeNull();
            expect(match[1]).toEqual(test.boss);
            expect(match[2]).toBe(test.gym);
        });
    });
});
