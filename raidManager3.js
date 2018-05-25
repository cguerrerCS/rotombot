"use strict";

const { FlexTime } = require("botsbits");
var Fuse = require("fuse.js");

const MAX_EGG_HATCH_TIME = 60;
const MAX_RAID_ACTIVE_TIME = 45;

var RaidManager = function () {
    this.bosses = undefined;
    this.bossSearch = undefined;
    this.gyms = undefined;
    this.gymSearch = undefined;
    this.raids = {};
    this.strict = false;

    setInterval(() => this.RaidListRefresh, 30 * 1000);
};

function getDeltaDate(date, deltaInMinutes) {
    return new Date(date.getTime() + (deltaInMinutes * 60 * 1000));
}

function getDeltaInMinutes(date1, date2) {
    return (date1.getTime() - date2.getTime()) / (60 * 1000);
}

RaidManager.RaidStateEnum = Object.freeze({ "egg": 1, "hatched": 2 });
RaidManager.maxEggHatchTime = MAX_EGG_HATCH_TIME;
RaidManager.maxRaidActiveTime = MAX_RAID_ACTIVE_TIME;

function validateGymObject(gym) {
    const required = ["City", "RaidLocation", "FriendlyName", "Lng", "Lat", "MapLink"];
    required.forEach((property) => {
        if (!gym.hasOwnProperty(property)) {
            throw new Error(`Raid Object missing "${property}" property.`);
        }
    });
}

function validateBossObject(boss) {
    const required = ["RaidBoss", "RaidTier"];
    required.forEach((property) => {
        if (!boss.hasOwnProperty(property)) {
            throw new Error(`Raid Boss Object missing "${property}" property.`);
        }
    });
}

RaidManager.prototype.setGymData = function (data, search) {
    // validate that the objects can be used with fuse
    data.forEach((obj) => validateGymObject(obj));
    this.gyms = data;

    if (!search) {
        const options = {
            shouldSort: true,
            caseSensitive: false,
            threshold: 0.6,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                "RaidLocation",
                "FriendlyName",
            ],
        };

        search = new Fuse(data, options); // "RaidData" is the item array
    }
    this.gymSearch = search;
};

RaidManager.prototype.setBossData = function (data, search) {
    // validate that the objects can be used with fuse
    data.forEach((obj) => validateBossObject(obj));
    this.bosses = data;

    if (!search) {
        var options = {
            shouldSort: true,
            caseSensitive: false,
            threshold: 0.4,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: [
                "RaidBoss",
            ],
        };

        search  = new Fuse(data, options);
    }
    this.bossSearch = search;
};

RaidManager.validateTier = function (wantTier) {
    let tier = Number(wantTier);

    if (Number.isNaN(tier)) {
        if ((typeof wantTier !== "string") || (!wantTier.startsWith("Tier"))) {
            throw new Error(`Tier value ${wantTier} must be a number.`);
        }
        tier = Number(wantTier.replace("Tier", "").trim());
    }

    if ((tier < 1) || (tier > 5)) {
        throw new Error(`Tier value ${wantTier} must be in the range 1-5.`);
    }
    return tier;
};

RaidManager.validateHatchTime = function (wantHatchTime) {
    let time = new FlexTime(wantHatchTime);
    const delta = new FlexTime().getDeltaInMinutes(time);

    if (delta > MAX_EGG_HATCH_TIME) {
        throw new Error(`Requested hatch time ${wantHatchTime} is too far in the future (max ${MAX_EGG_HATCH_TIME} minutes).`);
    }
    else if (delta < -1) {
        // a little fudge factor for people adding a raid right at hatch
        throw new Error(`Requested hatch time ${wantHatchTime} is in the past.`);
    }
    return time;
};

RaidManager.validateEggTimer = function (wantTimer) {
    const timer = Number(wantTimer);
    if (Number.isNaN(timer)) {
        throw new Error(`Egg timer value ${wantTimer} is not a number.`);
    }
    if ((timer < 1) || (timer > MAX_EGG_HATCH_TIME)) {
        throw new Error(`Egg timer ${wantTimer} is out of range (1..${MAX_EGG_HATCH_TIME}).`);
    }
    return timer;
};

RaidManager.validateRaidTimer = function (wantTimer) {
    const timer = Number(wantTimer);
    if (Number.isNaN(timer)) {
        throw new Error(`Raid timer value ${wantTimer} is not a number.`);
    }
    if ((timer < 1) || (timer > MAX_RAID_ACTIVE_TIME)) {
        throw new Error(`Raid timer ${wantTimer} is out of range (1..${MAX_RAID_ACTIVE_TIME}).`);
    }
    return timer;
};

RaidManager.prototype.validateBoss = function (wantBoss) {
    if (typeof wantBoss === "object") {
        validateBossObject(wantBoss);
        return wantBoss;
    }

    if (!this.bosses) {
        throw new Error("RaidManager not ready - bosses not initialized.");
    }

    var possibleBosses = this.bossSearch.search(wantBoss);
    if (possibleBosses.length < 1) {
        throw new Error(`No known boss matches requested name "${wantBoss}".`);
    }
    return possibleBosses[0];
};

RaidManager.prototype.validateGym = function (wantGym) {
    if (typeof wantGym === "object") {
        validateGymObject(wantGym);
        return wantGym;
    }

    if (!this.gyms) {
        throw new Error("RaidManager not ready - gyms not initialized.");
    }

    var possibleGyms = this.gymSearch.search(wantGym);
    if (possibleGyms.length < 1) {
        throw new Error(`No known gym matches requested name "${wantGym}".`);
    }
    return possibleGyms[0];
};

RaidManager.prototype.tryGetRaid = function (gymName) {
    if (!this.raids[gymName]) {
        let gym = this.validateGym(gymName);
        if (gym) {
            gymName = gym.RaidLocation;
        }
    }
    return this.raids[gymName];
};

RaidManager.prototype.tryGetBoss = function (wantBoss) {
    if (!this.gyms) {
        throw new Error("RaidManager not ready - bosses not initialized.");
    }

    var possibleBosses = this.bossSearch.search(wantBoss);
    if (possibleBosses.length < 1) {
        return undefined;
    }
    return possibleBosses[0];
};

RaidManager.prototype.tryGetGym = function (wantGym) {
    if (!this.gyms) {
        throw new Error("RaidManager not ready - gyms not initialized.");
    }

    var possibleGyms = this.gymSearch.search(wantGym);
    if (possibleGyms.length < 1) {
        return undefined;
    }
    return possibleGyms[0];
};

/**
 * Bypasses validity checks for testing
 */
RaidManager.prototype._forceRaid = function (wantGym, wantTier, wantBoss, wantHatchTime) {
    if (wantGym) {
        let gym = (typeof wantGym === "string") ? this.tryGetGym(wantGym) : wantGym;
        let boss = (typeof wantBoss === "string") ? this.tryGetBoss(wantBoss) : wantBoss;
        let hatchFlex = new FlexTime(wantHatchTime);
        let hatch = hatchFlex.toDate();
        let spawn = getDeltaDate(hatch, -MAX_EGG_HATCH_TIME);
        let expiry = getDeltaDate(hatch, MAX_RAID_ACTIVE_TIME);
        let delta = Date.now() - hatch.getTime();
        let state = (delta < 0 ? RaidManager.RaidStateEnum.hatched : RaidManager.RaidStateEnum.egg);

        let raid = {
            tier: wantTier,
            pokemon: boss,
            raidLocation: gym,
            state: state,
            spawnTime: spawn,
            hatchTime: hatch,
            expiryTime: expiry,
        };

        this.raids[gym.RaidLocation] = raid;
        return raid;
    }
    return undefined;
};

/**
 * Add a raid in hatched state
 * @param {String|Object} wantBoss
 * @param {String|Object} wantGym
 * @param {String|Number} wantMinutes
 */
RaidManager.prototype.addRaid = function (wantBoss, wantGym, wantMinutes) {
    let boss = this.validateBoss(wantBoss);
    let bossTier = Number(boss.RaidTier.replace("Tier ", ""));
    let gym = this.validateGym(wantGym);
    let minutes = RaidManager.validateRaidTimer(wantMinutes);
    let expiry = getDeltaDate(new Date(), minutes);
    let hatch = getDeltaDate(expiry, -MAX_RAID_ACTIVE_TIME);
    let spawn = getDeltaDate(hatch, -MAX_EGG_HATCH_TIME);

    if (this.strict && this.raids[gym.RaidLocation]) {
        let existing = this.raids[gym.RaidLocation];
        if (existing.pokemon && (existing.pokemon !== wantBoss)) {
            throw new Error(`Raid at ${gym.RaidLocation} already has a ${existing.pokemon.RaidBoss} boss.`);
        }

        if (bossTier !== existing.tier) {
            throw new Error(`Cannot add ${boss.RaidBoss} as boss of existing tier ${existing.tier} raid at ${gym.RaidLocation}`);
        }

        if (Math.abs(getDeltaInMinutes(expiry, existing.expiryTime)) > 5) {
            throw new Error(`New end time ${formatDateAmPm(expiry)} is too far from existing end ${formatDateAmPm(existing.expiryTime)} (max 5 minutes).`)
        }
    }

    let raid = {
        tier: bossTier,
        pokemon: boss,
        raidLocation: gym,
        state: RaidManager.RaidStateEnum.hatched,
        spawnTime: spawn,
        hatchTime: hatch,
        expiryTime: expiry,
    };

    this.raids[gym.RaidLocation] = raid;
    return raid;
};

RaidManager.prototype.setRaidBoss = function (wantBoss, wantGym) {
    let boss = this.validateBoss(wantBoss);
    let gym = this.validateGym(wantGym);

    if (gym.RaidLocation in this.raids) {
        let raid = this.raids[gym.RaidLocation];
        if (raid.state === RaidManager.RaidStateEnum.hatched) {
            if (this.strict) {
                if (raid.tier !== boss.RaidTier) {
                    throw new Error(`Cannot set ${boss.name} as boss for a tier ${raid.tier} raid.`);
                }
                else if (raid.pokemon) {
                    throw new Error(`Raid at ${gym.RaidLocation} already has a boss.`);
                }
            }
            raid.pokemon = boss;
        }
        else {
            throw new Error("Cannot set raid boss for unhatched egg.  Please update the raid time.");
        }
        return raid;
    }
    else {
        throw new Error("Cannot set raid boss of unreported raids. Please add the raid.");
    }
};

RaidManager.prototype.addEggCountdown = function (wantTier, wantGym, wantMinutes) {
    let tier = RaidManager.validateTier(wantTier);
    let gym = this.validateGym(wantGym);
    let minutes = RaidManager.validateEggTimer(wantMinutes);
    let hatch = getDeltaDate(new Date(), minutes);

    var raid = {
        tier: tier,
        pokemon: undefined,
        raidLocation: gym,
        state: RaidManager.RaidStateEnum.egg,
        spawnTime: getDeltaDate(hatch, -MAX_EGG_HATCH_TIME),
        hatchTime: hatch,
        expiryTime: getDeltaDate(hatch, MAX_RAID_ACTIVE_TIME),
    };

    if (this.strict && (raid.raidLocation.RaidLocation in this.raids)) {
        throw new Error(`Raid already reported for ${raid.raidLocation.RaidLocation}.`);
    }

    this.raids[raid.raidLocation.RaidLocation] = raid;
    return raid;
};

RaidManager.prototype.addEggAbsolute = function (wantTier, wantGym, wantHatchTime) {
    const tier = RaidManager.validateTier(wantTier);
    const gym = this.validateGym(wantGym);
    const hatch = RaidManager.validateHatchTime(wantHatchTime).toDate();

    var raid = {
        tier: tier,
        pokemon: undefined,
        raidLocation: gym,
        state: RaidManager.RaidStateEnum.egg,
        spawnTime: getDeltaDate(hatch, -MAX_EGG_HATCH_TIME),
        hatchTime: hatch,
        expiryTime: getDeltaDate(hatch, MAX_RAID_ACTIVE_TIME),
    };

    if (this.strict && (gym.RaidLocation in this.raids)) {
        throw new Error(`Gym ${gym.RaidLocation} already has a scheduled raid.`);
    }

    this.raids[gym.RaidLocation] = raid;
    return raid;
};

RaidManager.prototype.removeRaid = function (wantGym) {
    let gym = this.validateGym(wantGym);
    if (gym.RaidLocation in this.raids) {
        let raid = this.raids[gym.RaidLocation];
        delete this.raids[gym.RaidLocation];
        return raid;
    }
    else {
        throw new Error(`No raid reported at ${gym.RaidLocation}.`);
    }
};

/**
 * Get a list of all raid objects (hatched and not hatched) sorted by hatch time.
 */
RaidManager.prototype.list = function () {
    // create sortedRaids array (sorted by hatch time)
    let sortedRaids = [];
    for (let key in this.raids) {
        if (this.raids.hasOwnProperty(key)) {
            // this copy method will not work for nested objects
            var raidObj = this.raids[key];
            var raidObjCopy = Object.assign({}, raidObj);
            sortedRaids.push(raidObjCopy);
        }
    }

    // sort raids by date
    sortedRaids.sort((a, b) => a.hatchTime - b.hatchTime);

    return sortedRaids;
};

/**
 * Get a discord formatted raid list.
 */
RaidManager.prototype.listFormatted = function () {
    let raidListMarkupRaidActive = [];
    let raidListMarkupRaidUpcoming = [];
    raidListMarkupRaidActive.push("__**ACTIVE RAIDS**__\n");
    raidListMarkupRaidUpcoming.push("__**UPCOMING RAIDS**__\n");

    let sortedRaids = this.list();
    for (let i = 0; i < sortedRaids.length; i++) {
        let raid = sortedRaids[i];
        let tierString = "Tier " + raid.tier;
        if (raid.state === RaidManager.RaidStateEnum.egg) {
            raidListMarkupRaidUpcoming.push("[" + tierString +  "] " + raid.raidLocation.RaidLocation + " @ " + formatDateAmPm(raid.hatchTime) + "\n");
        }
        else if (raid.state === RaidManager.RaidStateEnum.hatched) {
            raidListMarkupRaidActive.push("[" + tierString + " " + raid.pokemon.RaidBoss + "] " + raid.raidLocation.RaidLocation + " ends @ " + formatDateAmPm(raid.expiryTime) + "\n");
        }
    }

    var output = "";
    if ((raidListMarkupRaidActive.length === 1) && (raidListMarkupRaidUpcoming.length === 1)) {
        output = "*No raids to report.*";
    }

    if (raidListMarkupRaidActive.length > 1) {
        output = output + raidListMarkupRaidActive.join("");
    }

    if ((raidListMarkupRaidUpcoming.length > 1) && (raidListMarkupRaidActive.length > 1)) {
        output = output + "\n" + raidListMarkupRaidUpcoming.join("");
    }
    else if ((raidListMarkupRaidUpcoming.length > 1) && (raidListMarkupRaidActive.length === 1)) {
        output = output + raidListMarkupRaidUpcoming.join("");
    }

    return output;
};

/**
 * Private function: Convert DataTime to readable format.
 */
function formatDateAmPm(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    let strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
}

/**
 * Private function: Refresh raid list to reflect eggs hatching and raids expiring.
 */
RaidManager.prototype.raidListRefresh = function () {
    let now = new Date();
    this.raids.forEach((key) => {
        let raid = this.raids[key];
        if ((raid.state === RaidManager.RaidStateEnum.egg) && (now >= this.raids[key].hatchTime)) {
            console.log("[Raid Manager] Raid Egg Hatched: " + key);
            raid.state = RaidManager.RaidStateEnum.hatched;
        }

        if (now > raid.expiryTime) {
            console.log("[Raid Manager] Raid Expired: " + key);
            delete this.raids[key];
        }
    });
};

module.exports = RaidManager;
