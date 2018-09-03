"use strict";

const addEggByStartTimeRegex = /^!add\s+(?:(?:L|T|l|t)?(\d+)\s+)?(\w+(?:\s|\w|'|-)*)(?:\s+(?:@|at)\s*)((?:\d?\d):?(?:\d\d)\s*(?:a|A|am|AM|p|P|pm|PM)?)$/i;
const addEggByTimerRegex = /^!add\s+(?:(?:L|T|l|t)?(\d+)\s+)?(\w+(?:\s|\w|'|-)*)(?:\s+(?:in)\s*)(\d?\d)\s*?$/i;
const addBossWithTimerRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s|'|-)*)(?:\s+(\d?\d)\s*(?:left))\s*?$/i;
const addBossWithTimerAltRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s|`|-)*)(?:for)(?:\s+(\d?\d)\s*)\s*?$/i;
const addBossNoTimerRegex = /^!add\s*((?:\w|-)+)\s*(?:@|at)\s*(\w+(?:\w|\s|`|-)*)$/i;

const fragments = {
    "[tier]":       { value: "(?:(?:L|T|l|t)?(\\d+))", optional: true },
    "[gym]":        { value: "(\\w+(?:\\s|\\w|`|'|-|\\.)*)", optional: false },
    "[timeofday]":  { value: "((?:\\d?\\d):?(?:\\d\\d)\\s*(?:a|A|am|AM|p|P|pm|PM)?)", optional: false },
    "[timer]":      { value: "(\\d?\\d)", optional: false },
    "[boss]":       { value: "((?:\\w|-)+)", optional: false },
};

function getField(raw) {
    let field = { value: undefined, optional: false };

    if (typeof raw === "string") {
        const key = raw.toLowerCase();
        if (fragments[key]) {
            raw = fragments[key];
        }
        else {
            field.value = raw;
            field.optional = false;
        }
    }

    if (typeof raw === "object") {
        field.value = raw.value;
        field.optional = (raw.optional === undefined) ? false : raw.optional;
    }
    return field;
}

function create(fields) {
    let separator = undefined;
    let str = "^";
    fields.forEach((raw) => {
        if (separator) {
            str += separator;
            separator = undefined;
        }

        let field = getField(raw);
        if (field.optional) {
            str += `(?:(?:${field.value})\\s+)?`;
        }
        else {
            str += field.value;
            separator = "\\s+";
        }
    });
    str += "\\s*$";
    return new RegExp(str, "i");
}

module.exports = {
    create: create,
};
