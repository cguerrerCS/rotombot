"use strict";

let { FlexTime } = require("botsbits");
let Utils = require("./utils");

let Rsvp = function (raiderName, gym, init) {
    init = init || {};

    this.raiderName = raiderName;
    this.gym = gym;
    this.etaTime = init.etaTime;
    this.arrivalTime = init.arrivalTime;
    this.startTime = init.startTime;
    this.endTime = init.endTime;
    this.code = init.code;
    return this;
};

Rsvp.RsvpStateEnum = Object.freeze({ "onTheWayNoEta": 0, "onTheWay": 1, "present": 2, "started": 3, "done": 4 });

function toRsvpTime(raid, time) {
    if (time === undefined) {
        return undefined;
    }
    else if (time instanceof Date) {
        return time;
    }
    else if (time instanceof FlexTime) {
        return time.toDate();
    }
    else if (typeof time === "string") {
        if (time.toLowerCase() === "hatch") {
            return raid.hatchTime;
        }
        else if (time.length < 3) {
            return new Date(Date.now() + (Number(time) * 60 * 1000));
        }
        return new FlexTime(time).toDate();
    }
    else if (typeof time === "number") {
        return new Date(time);
    }
    throw new Error(`Invalid time ${time} specified for rsvp.`);
}

function validateRsvpTime(raid, time, description) {
    time = toRsvpTime(raid, time);
    if (time) {
        if ((description !== "end time") && (time > raid.expiryTime)) {
            throw new Error(`Invalid ${description} ${Utils.formatTimeAmPm(time)} is after the raid has ended.`);
        }

        if (time < raid.startTime) {
            throw new Error(`Invalid ${description} ${Utils.formatTimeAmPm(time)} is before the raid spawned.`);
        }

        if (((description === "start time") || (description === "end time")) && (time < raid.hatchTime)) {
            throw new Error(`Invalid ${description} ${Utils.formatTimeAmPm(time)} is before the raid hatched.`);
        }
    }
    return time;
}

function createOrUpdateRsvp(raid, existingRsvp, rsvpUpdate) {
    existingRsvp = existingRsvp || {};

    if ((rsvpUpdate.raiderName === undefined) || (rsvpUpdate.raiderName.length < 1)) {
        throw new Error("Raider name must be specified.");
    }
    if ((existingRsvp.raiderName) && (existingRsvp.raiderName !== rsvpUpdate.raiderName)) {
        throw new Error(`Raider name mismatch on update (${existingRsvp.raiderName} !== ${rsvpUpdate.raiderName})`);
    }

    rsvpUpdate.etaTime = validateRsvpTime(raid, rsvpUpdate.etaTime, "eta");
    rsvpUpdate.arrivalTime = validateRsvpTime(raid, rsvpUpdate.arrivalTime, "arrival time");
    rsvpUpdate.startTime = validateRsvpTime(raid, rsvpUpdate.startTime, "start time");
    rsvpUpdate.endTime = validateRsvpTime(raid, rsvpUpdate.endTime, "end time");
    return new Rsvp(rsvpUpdate.raiderName, raid.gym, {
        etaTime: rsvpUpdate.etaTime || existingRsvp.etaTime,
        arrivalTime: rsvpUpdate.arrivalTime || existingRsvp.arrivalTime,
        startTime: rsvpUpdate.startTime || existingRsvp.startTime,
        endTime: rsvpUpdate.endTime || existingRsvp.endTime,
        code: rsvpUpdate.code || existingRsvp.code,
    });
}

function classifyRaiders(raiders) {
    let classified = { inbound: [], present: [], raiding: [], done: [] };
    for (let name in raiders) {
        if (raiders.hasOwnProperty(name)) {
            let raider = raiders[name];
            switch (raider.getState()) {
                case Rsvp.RsvpStateEnum.onTheWay:
                case Rsvp.RsvpStateEnum.onTheWayNoEta:
                    classified.inbound.push(raider);
                    break;
                case Rsvp.RsvpStateEnum.present:
                    classified.present.push(raider);
                    break;
                case Rsvp.RsvpStateEnum.started:
                    classified.raiding.push(raider);
                    break;
                case Rsvp.RsvpStateEnum.done:
                    classified.done.push(raider);
                    break;
            }
        }
    }

    let numPending = classified.present.length + classified.inbound.length;
    classified.summary = ((numPending < 1) ? "" : ((classified.inbound.length < 1) ? `(${classified.present.length})` : `(${classified.present.length}/${numPending})`));

    return classified;
}

Rsvp.prototype.getState = function () {
    if (this.endTime) {
        return Rsvp.RsvpStateEnum.done;
    }
    else if (this.startTime) {
        return Rsvp.RsvpStateEnum.started;
    }
    else if (this.arrivalTime) {
        return Rsvp.RsvpStateEnum.present;
    }
    else if (this.etaTime) {
        return Rsvp.RsvpStateEnum.onTheWay;
    }
    return Rsvp.RsvpStateEnum.onTheWayNoEta;
};

Rsvp.prototype.getRaider = function () { return this.raiderName; };
Rsvp.prototype.getGym = function () { return this.gym; };
Rsvp.prototype.getEstimatedArrivalTime = function () { return this.etaTime; };
Rsvp.prototype.getActualArrivalTime = function () { return this.arrivalTime; };
Rsvp.prototype.getRaidStartTime = function () { return this.startTime; };
Rsvp.prototype.getRaidEndTime = function () { return this.endTime; };
Rsvp.prototype.getRaidCode = function () { return this.code; };

Rsvp.prototype.toString = function (noEtaFormat, etaFormat, presentFormat, raidingFormat, doneFormat) {
    const formats = [
        noEtaFormat || "RAIDER_NAME is on the way.",
        etaFormat || "RAIDER_NAME eta is ETA_TIME.",
        presentFormat || "RAIDER_NAME is waiting.",
        raidingFormat || "RAIDER_NAME is raiding (RAID_CODE).",
        doneFormat || "RAIDER_NAME is done.",
    ];

    let description = formats[this.getState()];

    const parts = [
        { placeholder: "RAIDER_NAME", replacement: (r) => r.raiderName },
        { placeholder: "GYM_NAME", replacement: (r) => r.gym.name },
        { placeholder: "ETA_TIME", replacement: (r) => (r.etaTime ? Utils.formatTimeAmPm(r.etaTime) : "unknown") },
        { placeholder: "ARRIVAL_TIME", replacement: (r) => (r.arrivedTime ? Utils.formatTimeAmPm(r.arrivedTime) : "unknown") },
        { placeholder: "START_TIME", replacement: (r) => (r.startTime ? Utils.formatTimeAmPm(r.startTime) : "unknown") },
        { placeholder: "END_TIME", replacement: (r) => (r.endTime ? Utils.formatTimeAmPm(r.endTime) : "unknown") },
        { placeholder: "RAID_CODE", replacement: (r) => r.code || "" },
    ];

    parts.forEach((r) => {
        description = description.replace(r.placeholder, r.replacement(this));
    });

    return description;
};

function summarize(raiderList) {
    let summary = undefined;
    if (raiderList && raiderList.length > 0) {
        let lines = [];
        raiderList.forEach((raider) => {
            lines.push(raider.toString());
        });
        summary = lines.join("\n");
    }
    return summary;
}

function raidersObjectToString(raiders) {
    let result = undefined;
    if (raiders) {
        let lines = [];
        let classified = classifyRaiders(raiders);
        ["inbound", "present", "raiding", "done"].forEach((field) => {
            let summary = summarize(classified[field]);
            if (summary) {
                lines.push(summary);
            }
        });

        if (lines.length > 0) {
            result = lines.join("\n");
        }
    }
    return result;
}

function saveTime(t) {
    return (t ? t.getTime() : 0);
}

function restoreTime(t) {
    return (t > 0 ? new Date(t) : undefined);
}

Rsvp.prototype.toSaveState = function () {
    let saved = {
        raiderName: this.raiderName,
        etaTime: saveTime(this.etaTime),
        arrivalTime: saveTime(this.arrivalTime),
        startTime: saveTime(this.startTime),
        endTime: saveTime(this.endTime),
        code: this.code,
    };
    return saved;
};

function fromSaveState(saved, raid) {
    let init = {
        etaTime: restoreTime(saved.etaTime),
        arrivalTime: restoreTime(saved.arrivalTime),
        startTime: restoreTime(saved.startTime),
        endTime: restoreTime(saved.endTime),
        code: saved.code,
    };
    return new Rsvp(saved.raiderName, raid.gym, init);
}

module.exports = {
    createOrUpdateRsvp: createOrUpdateRsvp,
    fromSaveState: fromSaveState,
    classifyRaiders: classifyRaiders,
    raidersObjectToString: raidersObjectToString,
};
