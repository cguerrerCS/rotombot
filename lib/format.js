"use strict";

function formatObject(obj, formatObject, options) {
    formatObject = formatObject || options.format;

    let format = formatObject;
    let destination = (formatObject ? formatObject.destination : undefined) || "markdown";
    let parts = (options.partsByDestination ? options.partsByDestination[destination] : options.parts);

    if (typeof formatObject === "object") {
        format = formatObject.format;
    }
    else if (formatObject && (typeof formatObject !== "string")) {
        throw new Error("Format must be supplied as object or string.");
    }

    format = format || (options.formatsByDestination ? options.formatsByDestination[destination] : undefined);

    if (!format) {
        throw new Error("No format supplied in formatObject.");
    }
    if (!parts) {
        throw new Error("No parts supplied in formatObject.");
    }

    let result = format;
    parts.forEach((part) => {
        result = result.replace(part.placeholder, part.replacement(obj, { destination: destination }));
    });

    return result;
}

module.exports = {
    formatObject: formatObject,
};
