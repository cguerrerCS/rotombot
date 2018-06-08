"use strict";

const fs = require("fs");
const path = require("path");
const { FlexTime } = require("botsbits");
const Utils = require("./utils");
const Rsvp = require("./rsvp");
var Fuse = require("fuse.js");

const MAX_EGG_HATCH_TIME = 60;
const MAX_RAID_ACTIVE_TIME = 45;

var RaidManager = function (options) {
    this.bosses = undefined;
    this.bossSearch = undefined;
    this.gyms = undefined;
    this.gymSearch = undefined;
    this.raids = {};
    this.raidChannels = [];

    // default is strict=false, logToConsole=true
    this.strict = (options ? (options.strict ? true : false) : false);
    this.logger = (options ? options.logger : console);
    this.autosaveFile = (options ? options.autosaveFile : "./state/latest.json");
    this.autosaveFile = (this.autosaveFile ? path.resolve(path.normalize(this.autosaveFile)) : undefined);
    this.restoreFrom = this.autosaveFile;

    this.reportingSuspended = false;

    let refresh = (options && (options.refresh !== undefined)) ? options.refresh : 30;
    if (refresh > 0) {
        setInterval(() => this.raidListRefresh(), refresh * 1000);
    }
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
    const required = ["city", "name", "friendlyName", "lng", "lat"];
    required.forEach((property) => {
        if (!gym.hasOwnProperty(property)) {
            throw new Error(`Raid Object missing "${property}" property.`);
        }
    });

    if (!gym.mapLink) {
        gym.mapLink = `https://www.google.com/maps/dir/?api=1&destination=${gym.lng},${gym.lat}`;
    }
}

function validateBossObject(boss) {
    const required = ["name", "tier"];
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
                "name",
                "friendlyName",
            ],
        };

        search = new Fuse(data, options); // "RaidData" is the item array
    }
    this.gymSearch = search;

    this.tryRestoreState();
};

RaidManager.prototype.setBossData = function (data, search) {
    // validate that the objects can be used with fuse
    this.bosses = [];
    data.forEach((obj) => {
        validateBossObject(obj);
        if ((!obj.status) || (obj.status === "active")) {
            this.bosses.push(obj);
        }
    });

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
                "name",
            ],
        };

        search  = new Fuse(this.bosses, options);
    }
    this.bossSearch = search;

    this.tryRestoreState();
};

RaidManager.validateTier = function (wantTier) {
    if (wantTier !== undefined) {
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
    }
    return 5;
};

RaidManager.validateHatchTime = function (wantHatchTime) {
    let time = new FlexTime(wantHatchTime);
    const delta = new FlexTime().getDeltaInMinutes(time);

    if (delta > MAX_EGG_HATCH_TIME) {
        throw new Error(`Requested hatch time ${time.toString()} is too far in the future (max ${MAX_EGG_HATCH_TIME} minutes).`);
    }
    else if (delta < -1) {
        // a little fudge factor for people adding a raid right at hatch
        throw new Error(`Requested hatch time ${time.toString()} is in the past.`);
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
        let gym = this.tryGetGym(gymName);
        if (gym) {
            gymName = gym.name;
        }
    }
    return this.raids[gymName];
};

RaidManager.prototype.tryGetBoss = function (wantBoss) {
    if (!this.bosses) {
        throw new Error("RaidManager not ready - bosses not initialized.");
    }
    if (typeof wantBoss !== "string") {
        throw new Error("Must use boss name for tryGetBoss.");
    }

    var possibleBosses = this.bossSearch.search(wantBoss);
    if (possibleBosses.length < 1) {
        return undefined;
    }
    return possibleBosses[0];
};

RaidManager.prototype.findBosses = function (filter) {
    let bosses = [];
    this.bosses.forEach((b) => {
        if (filter(b)) {
            bosses.push(b);
        }
    });
    return bosses;
};

RaidManager.prototype.tryGetGym = function (wantGym) {
    if (!this.gyms) {
        throw new Error("RaidManager not ready - gyms not initialized.");
    }
    if (typeof wantGym !== "string") {
        throw new Error("Must use gym name for tryGetGym.");
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
RaidManager.prototype._forceRaid = function (wantGym, wantTier, wantBoss, wantHatchTime, wantState) {
    if (wantGym) {
        let gym = (typeof wantGym === "string") ? this.tryGetGym(wantGym) : wantGym;
        let boss = (typeof wantBoss === "string") ? this.tryGetBoss(wantBoss) : wantBoss;
        let hatch = (wantHatchTime instanceof Date) ? wantHatchTime : new FlexTime(wantHatchTime).toDate();
        let spawn = getDeltaDate(hatch, -MAX_EGG_HATCH_TIME);
        let expiry = getDeltaDate(hatch, MAX_RAID_ACTIVE_TIME);
        let delta = Date.now() - hatch.getTime();
        let state = wantState || (delta > 0 ? RaidManager.RaidStateEnum.hatched : RaidManager.RaidStateEnum.egg);

        let raid = {
            tier: wantTier,
            pokemon: boss,
            gym: gym,
            state: state,
            spawnTime: spawn,
            hatchTime: hatch,
            expiryTime: expiry,
            raiders: {},
        };

        if (this.raids[gym.name]) {
            raid.raiders = this.raids[gym.name].raiders;
        }

        this.raids[gym.name] = raid;

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
    let bossTier = Number(boss.tier.replace("Tier ", ""));
    let gym = this.validateGym(wantGym);
    let minutes = RaidManager.validateRaidTimer(wantMinutes);
    let expiry = getDeltaDate(new Date(), minutes);
    let hatch = getDeltaDate(expiry, -MAX_RAID_ACTIVE_TIME);
    let spawn = getDeltaDate(hatch, -MAX_EGG_HATCH_TIME);

    if (this.strict && this.raids[gym.name]) {
        let existing = this.raids[gym.name];
        if (existing.pokemon && (existing.pokemon !== boss)) {
            throw new Error(`Raid at ${gym.name} already has a ${existing.pokemon.name} boss.`);
        }

        if (bossTier !== existing.tier) {
            throw new Error(`Cannot add ${boss.name} as boss of existing tier ${existing.tier} raid at ${gym.name}`);
        }

        if (Math.abs(getDeltaInMinutes(expiry, existing.expiryTime)) > 5) {
            throw new Error(`New end time ${Utils.formatTimeAmPm(expiry)} is too far from existing end ${Utils.formatTimeAmPm(existing.expiryTime)} (max 5 minutes).`);
        }
    }

    let raid = {
        tier: bossTier,
        pokemon: boss,
        gym: gym,
        state: RaidManager.RaidStateEnum.hatched,
        spawnTime: spawn,
        hatchTime: hatch,
        expiryTime: expiry,
        raiders: {},
    };

    if (this.raids[gym.name]) {
        raid.raiders = this.raids[gym.name].raiders;
    }

    if (this.logger) {
        this.logger.log(`[Raid Manager] Active Raid added with relative time: ${raidToString(raid)}`);
    }

    this.raids[gym.name] = raid;
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.setRaidBoss = function (wantBoss, wantGym) {
    let boss = this.validateBoss(wantBoss);
    let gym = this.validateGym(wantGym);

    if (gym.name in this.raids) {
        let raid = this.raids[gym.name];
        if (raid.state === RaidManager.RaidStateEnum.hatched) {
            if (this.strict) {
                if ("Tier " + raid.tier !== boss.tier) {
                    throw new Error(`Cannot set ${boss.name} as boss for a tier ${raid.tier} raid.`);
                }
                else if (raid.pokemon && raid.pokemon !== boss) {
                    throw new Error(`Raid at ${gym.name} already has a ${boss.name} boss.`);
                }
            }
            raid.pokemon = boss;

            if ("Tier " + raid.tier !== boss.tier) {
                raid.tier = boss.tier.replace("Tier", "").trim();
            }

            if (this.logger) {
                this.logger.log(`[Raid Manager] Updated boss for raid: ${raidToString(raid)}`);
            }
            this.reportRaidsUpdate();
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
        gym: gym,
        state: RaidManager.RaidStateEnum.egg,
        spawnTime: getDeltaDate(hatch, -MAX_EGG_HATCH_TIME),
        hatchTime: hatch,
        expiryTime: getDeltaDate(hatch, MAX_RAID_ACTIVE_TIME),
        raiders: {},
    };

    if (this.strict && (raid.gym.name in this.raids)) {
        let existing = this.raids[raid.gym.name];
        if (existing.pokemon !== undefined) {
            throw new Error(`Cannot replace existing ${existing.pokemon.name} raid for ${raid.gym.name}.`);
        }

        if (existing.tier !== raid.tier) {
            throw new Error(`Cannot replace existing tier ${existing.tier} raid for ${raid.gym.name}.`);
        }

        if (Math.abs(getDeltaInMinutes(raid.expiryTime, existing.expiryTime)) > 5) {
            throw new Error(`New end time ${Utils.formatTimeAmPm(raid.expiryTime)} is too far from existing end ${Utils.formatTimeAmPm(existing.expiryTime)} (max 5 minutes).`);
        }
    }


    if (this.raids[gym.name]) {
        raid.raiders = this.raids[gym.name].raiders;
    }

    if (this.logger) {
        this.logger.log(`[Raid Manager] Raid egg added with relative time: ${raidToString(raid)}`);
    }

    this.raids[raid.gym.name] = raid;
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.addEggAbsolute = function (wantTier, wantGym, wantHatchTime) {
    const tier = RaidManager.validateTier(wantTier);
    const gym = this.validateGym(wantGym);
    const hatch = ((wantHatchTime instanceof Date) ? wantHatchTime : RaidManager.validateHatchTime(wantHatchTime).toDate());

    var raid = {
        tier: tier,
        pokemon: undefined,
        gym: gym,
        state: RaidManager.RaidStateEnum.egg,
        spawnTime: getDeltaDate(hatch, -MAX_EGG_HATCH_TIME),
        hatchTime: hatch,
        expiryTime: getDeltaDate(hatch, MAX_RAID_ACTIVE_TIME),
        raiders: {},
    };

    if (this.strict && (gym.name in this.raids)) {
        let existing = this.raids[raid.gym.name];
        if (existing.pokemon !== undefined) {
            throw new Error(`Cannot replace existing ${existing.pokemon.name} raid for ${raid.gym.name}.`);
        }

        if (existing.tier !== raid.tier) {
            throw new Error(`Cannot replace existing tier ${existing.tier} raid for ${raid.gym.name}.`);
        }

        if (Math.abs(getDeltaInMinutes(raid.expiryTime, existing.expiryTime)) > 5) {
            throw new Error(`New end time ${Utils.formatTimeAmPm(raid.expiryTime)} is too far from existing end ${Utils.formatTimeAmPm(existing.expiryTime)} (max 5 minutes).`);
        }
    }

    if (this.raids[gym.name]) {
        raid.raiders = this.raids[gym.name].raiders;
    }

    if (this.logger) {
        this.logger.log(`[Raid Manager] Raid egg added with absolute time: ${raidToString(raid)}`);
    }

    this.raids[gym.name] = raid;
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.removeRaid = function (wantGym) {
    let gym = this.validateGym(wantGym);
    if (gym.name in this.raids) {
        let raid = this.raids[gym.name];
        delete this.raids[gym.name];
        if (this.logger) {
            this.logger.log(`[Raid Manager] Raid removed: ${raidToString(raid)}`);
        }
        this.reportRaidsUpdate();
        return raid;
    }
    else {
        throw new Error(`No raid reported at ${gym.name}.`);
    }
};

RaidManager.prototype.addOrUpdateRaider = function (wantGym, raiderInfo) {
    let gym = this.validateGym(wantGym);
    let raid = this.raids[gym.name];
    if (!raid) {
        throw new Error(`No raid reported at ${gym.name}.`);
    }

    raiderInfo = Rsvp.createOrUpdateRsvp(raid, raid.raiders[raiderInfo.raiderName], raiderInfo);
    raid.raiders[raiderInfo.raiderName] = raiderInfo;
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.tryGetRaider = function (wantGym, raiderName) {
    let gym = this.validateGym(wantGym);
    let raid = this.raids[gym.name];
    if (!raid) {
        throw new Error(`No raid reported at ${gym.name}.`);
    }
    return raid.raiders[raiderName];
};

RaidManager.prototype.removeRaider = function (wantGym, raiderName) {
    let gym = this.validateGym(wantGym);
    let raid = this.raids[gym.name];
    if (!raid) {
        throw new Error(`No raid reported at ${gym.name}.`);
    }
    if (!raid.raiders[raiderName]) {
        throw new Error(`Raider ${raiderName} has not rsvp'ed for ${gym.name}.`);
    }
    delete raid.raiders[raiderName];
    return raid;
};

/**
 * Get a list of all raid objects (hatched and not hatched) sorted by hatch time.
 */
RaidManager.prototype.list = function (filter) {
    filter = filter || function () { return true; };

    // create sortedRaids array (sorted by hatch time)
    let sortedRaids = [];
    for (let key in this.raids) {
        if (this.raids.hasOwnProperty(key)) {
            // this copy method will not work for nested objects
            var raidObj = this.raids[key];
            if (filter(raidObj)) {
                var raidObjCopy = Object.assign({}, raidObj);
                sortedRaids.push(raidObjCopy);
            }
        }
    }

    // sort raids by date
    sortedRaids.sort((a, b) => a.hatchTime - b.hatchTime);

    return sortedRaids;
};

/**
 * Get a discord formatted raid list.
 */
RaidManager.prototype.listFormatted = function (filter, filterDescription) {
    filter = filter || function () { return true; };

    let raidListMarkupRaidActive = [];
    let raidListMarkupRaidUpcoming = [];

    const activeHeader = (filterDescription ? `__**ACTIVE RAIDS ${filterDescription} **__\n` : "__**ACTIVE RAIDS**__\n");
    const upcomingHeader = (filterDescription ? `__**UPCOMING RAIDS ${filterDescription} **__\n` : "__**UPCOMING RAIDS**__\n");

    raidListMarkupRaidActive.push(activeHeader);
    raidListMarkupRaidUpcoming.push(upcomingHeader);

    let sortedRaids = this.list(filter);
    for (let i = 0; i < sortedRaids.length; i++) {
        let raid = RaidManager.getFormattedRaidDescription(sortedRaids[i]);
        let raidList = (raid.active ? raidListMarkupRaidActive : raidListMarkupRaidUpcoming);
        raidList.push(raid.description + "\n");
    }

    var output = "";
    if ((raidListMarkupRaidActive.length === 1) && (raidListMarkupRaidUpcoming.length === 1)) {
        output = (filterDescription ? `*No raids to report (${filterDescription}).*` : "No raids to report.");
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

function formatRaidDescription(description, raid) {
    const parts = [
        { placeholder: "STATE", replacement: (r) => (r.state === RaidManager.RaidStateEnum.egg ? "Upcoming" : "Current") },
        { placeholder: "TIER", replacement: (r) => `T${r.tier}` },
        { placeholder: "GYM_NAME", replacement: (r) => r.gym.name },
        { placeholder: "FRIENDLY_NAME", replacement: (r) => r.gym.friendlyName },
        { placeholder: "BOSS_NAME", replacement: (r) => (r.pokemon ? r.pokemon.name : "Undefined") },
        { placeholder: "HATCH_TIME", replacement: (r) => Utils.formatTimeAmPm(r.hatchTime) },
        { placeholder: "EXPIRY_TIME", replacement: (r) => Utils.formatTimeAmPm(r.expiryTime) },
        { placeholder: "RAIDER_SUMMARY", replacement: (r) => Rsvp.classifyRaiders(r.raiders).summary },
    ];

    parts.forEach((r) => {
        description = description.replace(r.placeholder, r.replacement(raid));
    });
    return description;
}

RaidManager.getFormattedRaidDescription = function (raid, eggFormat, bossFormat) {
    eggFormat = eggFormat || "[TIER] GYM_NAME @ HATCH_TIME RAIDER_SUMMARY\n";
    bossFormat = bossFormat || "[TIER BOSS_NAME] GYM_NAME ends @ EXPIRY_TIME RAIDER_SUMMARY\n";

    if (raid.state === RaidManager.RaidStateEnum.egg) {
        return {
            active: false,
            description: formatRaidDescription(eggFormat, raid),
        };
    }
    else if (raid.state === RaidManager.RaidStateEnum.hatched) {
        return {
            active: true,
            description: formatRaidDescription(bossFormat, raid),
        };
    }
    throw new Error(`Internal error: unexpected raid state ${raid.state}`);
};

function raidToString(raidObj) {
    //Tier: tier,
    //Pokemon: "Unknown",
    //RaidLocation: location,
    //State: RaidStateEnum.egg,
    //SpawnTime: spawnTime,
    //HatchTime: hatchTime,
    //ExpiryTime: expiryTime

    let now = Utils.formatTimeAmPm(new Date());
    let spawn = Utils.formatTimeAmPm(raidObj.spawnTime);
    let hatch = Utils.formatTimeAmPm(raidObj.hatchTime);
    let expiry = Utils.formatTimeAmPm(raidObj.expiryTime);
    return `[Location: ${raidObj.gym.name}, Now: ${now}, SpawnTime: ${spawn}, HatchTime: ${hatch}, ExpiryTime: ${expiry}]`;
}

/**
 * Private function: Refresh raid list to reflect eggs hatching and raids expiring.
 */
RaidManager.prototype.raidListRefresh = function () {
    let changed = false;
    let now = new Date();
    for (let key in this.raids) {
        if (this.raids.hasOwnProperty(key)) {
            let raid = this.raids[key];
            if ((raid.state === RaidManager.RaidStateEnum.egg) && (now >= this.raids[key].hatchTime)) {
                let possibleBosses = this.findBosses((b) => b.tier === `Tier ${raid.tier}`);
                if (possibleBosses.length === 1) {
                    raid.pokemon = possibleBosses[0];
                }

                if (this.logger) {
                    this.logger.log(`[Raid Manager] Raid Egg Hatched: ${key}`);
                }
                raid.state = RaidManager.RaidStateEnum.hatched;
                changed = true;
            }

            if (now > raid.expiryTime) {
                if (this.logger) {
                    this.logger.log(`[Raid Manager] Raid Expired: ${key}`);
                }
                delete this.raids[key];
                changed = true;
            }
        }
    }

    if (changed) {
        this.reportRaidsUpdate();
    }
};

RaidManager.prototype.addRaidChannel = function (channel) {
    this.raidChannels.push(channel);
};

RaidManager.prototype.reportRaidsUpdate = function () {
    if (!this.reportingSuspended) {
        this.raidChannels.forEach((channel) => {
            channel.update();
        });
        this.trySaveState();
    }
};

function getRaidersSaveState(raiders) {
    let saved = [];
    for (let raiderName in raiders) {
        if (raiders.hasOwnProperty(raiderName)) {
            saved.push(raiders[raiderName].toSaveState());
        }
    }
    return saved;
}

RaidManager.prototype.getSaveState = function () {
    let raids = [];
    this.list().forEach((raid) => {
        let saved = {
            gym: raid.gym.name,
            hatch: raid.hatchTime.getTime(),
            expiry: raid.expiryTime.getTime(),
            boss: (raid.pokemon ? raid.pokemon.name : undefined),
            tier: raid.tier,
            raiders: getRaidersSaveState(raid.raiders),
        };
        raids.push(saved);
    });
    return raids;
};

function restoreRaiders(raid, savedRaiders) {
    let restored = {};
    if (savedRaiders) {
        savedRaiders.forEach((saved) => {
            restored[saved.raiderName] = Rsvp.fromSaveState(saved, raid);
        });
    }
    return restored;
}

RaidManager.prototype.restoreFromSaveState = function (allSaved) {
    let self = this;
    allSaved.forEach((saved) => {
        if (saved.expiry > Date.now()) {
            let gym = self.gyms.find((g) => g.name === saved.gym);
            if (gym !== undefined) {
                let boss = (saved.boss ? self.bosses.find((b) => b.name === saved.boss) : undefined);
                let raid = self._forceRaid(gym, saved.tier, boss, new Date(saved.hatch));
                raid.raiders = restoreRaiders(raid, saved.raiders);
                if (this.logger) {
                    this.logger.log(`Restored: ${RaidManager.getFormattedRaidDescription(raid).description}\n`);
                }
            }
        }
        else if (this.logger) {
            this.logger.log(`Expired: ${saved.gym}`);
        }
    });
};

RaidManager.prototype.tryRestoreState = function () {
    if (this.bosses && this.gyms && this.restoreFrom && fs.existsSync(this.restoreFrom)) {
        try {
            const restoreFrom = this.restoreFrom;
            this.restoreFrom = undefined;
            if (this.logger) {
                this.logger.log(`Attempting to restore from ${restoreFrom}`);
            }
            this.reportingSuspended = true;
            this.restoreFromSaveState(JSON.parse(fs.readFileSync(restoreFrom, "utf8")));
            this.reportingSuspended = false;
            this.trySaveState();
            this.reportRaidsUpdate();
        }
        catch (e) {
            if (this.logger) {
                this.logger.log(`Error restoring raid state: ${e}`);
            }
            this.reportingSuspended = false;
        }
    }
};

RaidManager.prototype.trySaveState = function () {
    if (this.autosaveFile && this.raids) {
        try {
            let stateToSave = JSON.stringify(this.getSaveState());
            fs.writeFileSync(this.autosaveFile, stateToSave, { encoding: "utf8", flag: "w" });
            if (this.logger) {
                this.logger.log(`Saved state to ${this.autosaveFile}.`);
            }
        }
        catch (e) {
            if (this.logger) {
                this.logger.log(`Error saving raid state to ${this.autosaveFile}: ${e}`);
            }
        }
    }
};

module.exports = RaidManager;
