"use strict";

function formatObject(obj, formatObject, options) {
    let parts = options.parts;

    formatObject = formatObject || options.format;
    let format = formatObject;

    if (typeof formatObject === "object") {
        format = formatObject.format;
        if (formatObject.destination) {
            format = format || (options.formatsByDestination ? options.formatsByDestination[formatObject.destination] : undefined);
            parts = (options.partsByDestination ? options.partsByDestination[formatObject.destination] : parts);
        }
    }
    else if (typeof formatObject !== "string") {
        throw new Error("Format must be supplied as object or string.");
    }

    if (!format) {
        throw new Error("No format supplied in formatObject.");
    }
    if (!parts) {
        throw new Error("No parts supplied in formatObject.");
    }

    let result = format;
    parts.forEach((part) => {
        result = result.replace(part.placeholder, part.replacement(obj, options));
    });

    return result;
}

module.exports = {
    formatObject: formatObject,
};
