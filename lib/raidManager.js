"use strict";

const fs = require("fs");
const path = require("path");
const { FlexTime } = require("botsbits");
var Fuse = require("fuse.js");

const Gym = require("./gym");
const GymDirectory = require("./gymDirectory");
const Raid = require("./raid");
const Rsvp = require("./rsvp");
const Utils = require("./utils");

var RaidManager = function (options) {
    this.bosses = undefined;
    this.bossSearch = undefined;
    this.gyms = undefined;
    this.raids = {};
    this.raidChannels = [];

    // default is strict=false, logToConsole=true
    this.strict = (options ? (options.strict ? true : false) : false);
    this.logger = (options && options.hasOwnProperty("logger") ? options.logger : null);
    this.autosaveFile = (options && options.hasOwnProperty("autosaveFile") ? options.autosaveFile : "./state/latest.json");
    this.autosaveFile = (this.autosaveFile ? path.resolve(path.normalize(this.autosaveFile)) : undefined);
    this.restoreFrom = this.autosaveFile;

    this.reportingSuspended = false;

    let refresh = (options && (options.refresh !== undefined)) ? options.refresh : 30;
    if (refresh > 0) {
        setInterval(() => this.raidListRefresh(), refresh * 1000);
    }
};

const raidLogFormat = "[Location: FRIENDLY_NAME, Now: NOW, SpawnTime: SPAWN_TIME, HatchTime: HATCH_TIME, ExpiryTime: EXPIRY_TIME]";

function validateBossObject(boss) {
    const required = ["name", "tier", "image", "status"];
    required.forEach((property) => {
        if (!boss.hasOwnProperty(property)) {
            throw new Error(`Raid Boss Object missing "${property}" property.`);
        }
    });
}

RaidManager.prototype.initGymDataAsync = function (stream, options) {
    let self = this;
    GymDirectory.processCsvAsync(stream, (gyms) => self.setGymData(gyms), options);
};

RaidManager.prototype.setGymData = function (gyms) {
    if (!(gyms instanceof GymDirectory)) {
        if (Array.isArray(gyms)) {
            gyms = GymDirectory.fromCsvData(gyms);
        }

        if (!(gyms instanceof GymDirectory)) {
            throw new Error(`Cannot intialize gym data: expected GymDirectory or array, got ${typeof gyms}.`);
        }
    }

    this.gyms = gyms;
    this.tryRestoreState();
};

RaidManager.prototype.setBossData = function (data, search) {
    // validate that the objects can be used with fuse
    this.bosses = [];
    data.forEach((obj) => {
        validateBossObject(obj);
        if ((!obj.status) || (obj.status === "active")) {
            let boss = JSON.parse(JSON.stringify(obj));
            boss.image = `http://www.didjaredo.com/pogo/images/32x32/${boss.image}`;
            boss.guideLink = `http://www.pokebattler.com/raids/${boss.name.toUpperCase()}`;
            this.bosses.push(boss);
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

RaidManager.prototype.validateGym = function (wantGym, lookupOptions) {
    if (wantGym instanceof Gym) {
        return wantGym;
    }
    if (typeof wantGym !== "string") {
        throw new Error("Invalid gym - expected Gym object or name.");
    }

    if (!this.gyms) {
        throw new Error("RaidManager not ready - gyms not initialized.");
    }

    var possibleGyms = this.gyms.tryGetGyms(wantGym, lookupOptions);
    if (possibleGyms.length < 1) {
        throw new Error(`No known gym matches requested name "${wantGym}".`);
    }
    return possibleGyms[0].gym;
};

RaidManager.prototype.validateRaidGym = function (wantGym, lookupOptions) {
    if (wantGym instanceof Gym) {
        return wantGym;
    }
    if (typeof wantGym !== "string") {
        throw new Error("Invalid gym - expected Gym object or name.");
    }

    if (!this.gyms) {
        throw new Error("RaidManager not ready - gyms not initialized.");
    }

    var possibleGyms = this.gyms.tryGetGyms(wantGym, lookupOptions);
    if (possibleGyms.length < 1) {
        throw new Error(`No known gym matches requested name "${wantGym}".`);
    }

    for (let i = 0; i < possibleGyms.length; i++) {
        if (this.raids.hasOwnProperty(possibleGyms[i].gym.key)) {
            return possibleGyms[i].gym;
        }
    }

    return possibleGyms[0].gym;
};

RaidManager.prototype.tryGetRaid = function (gymName) {
    if (typeof gymName !== "string") {
        throw new Error("Must use gym name for tryGetRaid.");
    }

    let normalized = Utils.normalize(gymName);
    if (!this.raids[normalized]) {
        let gym = this.tryGetGym(gymName);
        if (gym) {
            normalized = gym.key;
        }
    }
    return this.raids[normalized];
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

RaidManager.prototype.tryGetGym = function (wantGym, lookupOptions) {
    var possibleGyms = this.tryGetGyms(wantGym, lookupOptions);
    if (possibleGyms.length < 1) {
        return undefined;
    }
    return possibleGyms[0].gym;
};

RaidManager.prototype.tryGetGyms = function (wantGym, lookupOptions) {
    if (!this.gyms) {
        throw new Error("RaidManager not ready - gyms not initialized.");
    }
    if (typeof wantGym !== "string") {
        throw new Error("Must use gym name for tryGetGym.");
    }

    return this.gyms.tryGetGyms(wantGym, lookupOptions);
};

/**
 * Bypasses validity checks for testing
 */
RaidManager.prototype._forceRaid = function (wantGym, wantTier, wantBoss, wantHatchTime, wantState, lookupOptions) {
    if (wantGym) {
        let gym = (typeof wantGym === "string") ? this.tryGetGym(wantGym, lookupOptions) : wantGym;
        let boss = (typeof wantBoss === "string") ? this.tryGetBoss(wantBoss) : wantBoss;
        let hatch = (wantHatchTime instanceof Date) ? wantHatchTime : new FlexTime(wantHatchTime).toDate();
        let spawn = Utils.getDeltaDate(hatch, -Raid.maxEggHatchTime);
        let expiry = Utils.getDeltaDate(hatch, Raid.maxRaidActiveTime);
        let delta = Date.now() - hatch.getTime();
        let state = wantState || (delta > 0 ? Raid.State.hatched : Raid.State.egg);

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

        if (this.raids[gym.key]) {
            raid.raiders = this.raids[gym.key].raiders;
        }

        this.raids[gym.key] = raid;
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
RaidManager.prototype.addRaid = function (wantBoss, wantGym, wantMinutes, lookupOptions) {
    let boss = this.validateBoss(wantBoss);
    let bossTier = Number(boss.tier.replace("Tier ", ""));
    let gym = this.validateGym(wantGym, lookupOptions);
    let minutes = Raid.validateRaidTimer(wantMinutes);
    let expiry = Utils.getDeltaDate(new Date(), minutes);
    let hatch = Utils.getDeltaDate(expiry, -Raid.maxRaidActiveTime);
    let spawn = Utils.getDeltaDate(hatch, -Raid.maxEggHatchTime);

    if (this.strict && this.raids[gym.key]) {
        let existing = this.raids[gym.key];
        if (existing.pokemon && (existing.pokemon !== boss)) {
            throw new Error(`Raid at ${gym.friendlyName} already has a ${existing.pokemon.name} boss.`);
        }

        if (bossTier !== existing.tier) {
            throw new Error(`Cannot add ${boss.name} as boss of existing tier ${existing.tier} raid at ${gym.friendlyName}`);
        }

        if (Math.abs(Utils.getDeltaInMinutes(expiry, existing.expiryTime)) > 5) {
            throw new Error(`New end time ${Utils.formatTimeAmPm(expiry)} is too far from existing end ${Utils.formatTimeAmPm(existing.expiryTime)} (max 5 minutes).`);
        }
    }

    let raid = {
        tier: bossTier,
        pokemon: boss,
        gym: gym,
        state: Raid.State.hatched,
        spawnTime: spawn,
        hatchTime: hatch,
        expiryTime: expiry,
        raiders: {},
    };

    if (this.raids[gym.key]) {
        raid.raiders = this.raids[gym.key].raiders;
    }

    if (this.logger) {
        this.logger.log(`[Raid Manager] Active Raid added with relative time: ${Raid.raidToString(raid, raidLogFormat)}`);
    }

    this.raids[gym.key] = raid;
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.setRaidBoss = function (wantBoss, wantGym, lookupOptions) {
    let boss = this.validateBoss(wantBoss);
    let gym = this.validateRaidGym(wantGym, lookupOptions);

    if (gym.key in this.raids) {
        let raid = this.raids[gym.key];
        if (raid.state === Raid.State.hatched) {
            if (this.strict) {
                if ("Tier " + raid.tier !== boss.tier) {
                    throw new Error(`Cannot set ${boss.name} as boss for a tier ${raid.tier} raid.`);
                }
                else if (raid.pokemon && raid.pokemon !== boss) {
                    throw new Error(`Raid at ${gym.friendlyName} already has a ${boss.name} boss.`);
                }
            }

            raid.pokemon = boss;
            if ("Tier " + raid.tier !== boss.tier) {
                raid.tier = boss.tier.replace("Tier", "").trim();
            }

            if (this.logger) {
                this.logger.log(`[Raid Manager] Updated boss for raid: ${Raid.raidToString(raid, raidLogFormat)}`);
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

RaidManager.prototype.addEggCountdown = function (wantTier, wantGym, wantMinutes, lookupOptions) {
    let tier = Raid._validateTier(wantTier);
    let gym = this.validateGym(wantGym, lookupOptions);
    let minutes = Raid.validateEggTimer(wantMinutes);
    let hatch = Utils.getDeltaDate(new Date(), minutes);

    var raid = {
        tier: tier,
        pokemon: undefined,
        gym: gym,
        state: Raid.State.egg,
        spawnTime: Utils.getDeltaDate(hatch, -Raid.maxEggHatchTime),
        hatchTime: hatch,
        expiryTime: Utils.getDeltaDate(hatch, Raid.maxRaidActiveTime),
        raiders: {},
    };

    if (this.strict && (raid.gym.key in this.raids)) {
        let existing = this.raids[raid.gym.key];
        if (existing.pokemon !== undefined) {
            throw new Error(`Cannot replace existing ${existing.pokemon.name} raid for ${raid.gym.friendlyName}.`);
        }

        if (existing.tier !== raid.tier) {
            throw new Error(`Cannot replace existing tier ${existing.tier} raid for ${raid.gym.friendlyName}.`);
        }

        if (Math.abs(Utils.getDeltaInMinutes(raid.expiryTime, existing.expiryTime)) > 5) {
            throw new Error(`New end time ${Utils.formatTimeAmPm(raid.expiryTime)} is too far from existing end ${Utils.formatTimeAmPm(existing.expiryTime)} (max 5 minutes).`);
        }
    }


    if (this.raids[gym.key]) {
        raid.raiders = this.raids[gym.key].raiders;
    }

    if (this.logger) {
        this.logger.log(`[Raid Manager] Raid egg added with relative time: ${Raid.raidToString(raid, raidLogFormat)}`);
    }

    this.raids[raid.gym.key] = raid;
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.addEggAbsolute = function (wantTier, wantGym, wantHatchTime, lookupOptions) {
    const tier = Raid._validateTier(wantTier);
    const gym = this.validateGym(wantGym, lookupOptions);
    const hatch = ((wantHatchTime instanceof Date) ? wantHatchTime : Raid.validateHatchTime(wantHatchTime).toDate());

    var raid = {
        tier: tier,
        pokemon: undefined,
        gym: gym,
        state: Raid.State.egg,
        spawnTime: Utils.getDeltaDate(hatch, -Raid.maxEggHatchTime),
        hatchTime: hatch,
        expiryTime: Utils.getDeltaDate(hatch, Raid.maxRaidActiveTime),
        raiders: {},
    };

    if (this.strict && (gym.key in this.raids)) {
        let existing = this.raids[raid.gym.key];
        if (existing.pokemon !== undefined) {
            throw new Error(`Cannot replace existing ${existing.pokemon.name} raid for ${raid.gym.friendlyName}.`);
        }

        if (existing.tier !== raid.tier) {
            throw new Error(`Cannot replace existing tier ${existing.tier} raid for ${raid.gym.friendlyName}.`);
        }

        if (Math.abs(Utils.getDeltaInMinutes(raid.expiryTime, existing.expiryTime)) > 5) {
            throw new Error(`New end time ${Utils.formatTimeAmPm(raid.expiryTime)} is too far from existing end ${Utils.formatTimeAmPm(existing.expiryTime)} (max 5 minutes).`);
        }
    }

    if (this.raids[gym.key]) {
        raid.raiders = this.raids[gym.key].raiders;
    }

    if (this.logger) {
        this.logger.log(`[Raid Manager] Raid egg added with absolute time: ${Raid.raidToString(raid, raidLogFormat)}`);
    }

    this.raids[gym.key] = raid;
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.removeRaid = function (wantGym) {
    let gym = this.validateRaidGym(wantGym);
    if (gym.key in this.raids) {
        let raid = this.raids[gym.key];
        delete this.raids[gym.key];
        if (this.logger) {
            this.logger.log(`[Raid Manager] Raid removed: ${Raid.raidToString(raid, raidLogFormat)}`);
        }
        this.reportRaidsUpdate();
        return raid;
    }
    else {
        throw new Error(`No raid reported at ${gym.friendlyName}.`);
    }
};

RaidManager.prototype.findDefaultGymForRaider = function (raiderName) {
    let gyms = [];

    this.forEachRaid((r) => gyms.push(r.gym), (r) => (r.raiders[raiderName] ? true : false));

    if (gyms.length === 0) {
        throw new Error(`Raider ${raiderName} has not rsvp'ed for any raids.`);
    }

    if (gyms.length > 1) {
        throw new Error(`Raider ${raiderName} has rsvp'ed for multiple raids. Please specifiy a gym.`);
    }
    return gyms[0];
};

RaidManager.prototype.validateGymForRaider = function (wantGym, lookupOptions, raiderName) {
    return (wantGym ? this.validateRaidGym(wantGym, lookupOptions) : this.findDefaultGymForRaider(raiderName));
};

RaidManager.prototype.addOrUpdateRaider = function (wantGym, raiderInfo, lookupOptions) {
    let gym = this.validateGymForRaider(wantGym, lookupOptions, raiderInfo.raiderName);
    let raid = this.raids[gym.key];
    if (!raid) {
        throw new Error(`No raid reported at ${gym.friendlyName}.`);
    }

    raiderInfo = Rsvp.createOrUpdateRsvp(raid, raid.raiders[raiderInfo.raiderName], raiderInfo);
    raid.raiders[raiderInfo.raiderName] = raiderInfo;
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.tryGetRaider = function (wantGym, raiderName, lookupOptions) {
    let gym = this.validateRaidGym(wantGym, lookupOptions);
    let raid = this.raids[gym.key];
    if (!raid) {
        throw new Error(`No raid reported at ${gym.friendlyName}.`);
    }
    return raid.raiders[raiderName];
};

RaidManager.prototype.removeRaider = function (wantGym, raiderName, lookupOptions) {
    let gym = this.validateGymForRaider(wantGym, lookupOptions, raiderName);
    let raid = this.raids[gym.key];
    if (!raid) {
        throw new Error(`No raid reported at ${gym.friendlyName}.`);
    }
    if (!raid.raiders[raiderName]) {
        throw new Error(`Raider ${raiderName} has not rsvp'ed for ${gym.friendlyName}.`);
    }
    delete raid.raiders[raiderName];
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.clearAllRaiders = function (wantGym, lookupOptions) {
    let gym = this.validateRaidGym(wantGym, lookupOptions);
    let raid = this.raids[gym.key];
    raid.raiders = {};
    this.reportRaidsUpdate();
    return raid;
};

RaidManager.prototype.chooseBestRaidsForLookupOptions = function (allRaids, lookupOptions) {
    lookupOptions = lookupOptions || {};

    let allGyms = [];
    Utils.forOwn(allRaids, (raid) => allGyms.push(raid.gym));

    let bestGyms = this.gyms.chooseBestGymsForLookupOptions(allGyms, lookupOptions);
    if (bestGyms.length === allGyms.length) {
        return allRaids;
    }

    let bestRaids = [];
    Utils.forOwn(bestGyms, (gym) => bestRaids.push(this.raids[gym.key]));
    return bestRaids;
};

RaidManager.prototype.forEachRaid = function (func, filter) {
    filter = filter || function () { return true; };

    Utils.forOwn(this.raids, (raid) => {
        if (filter(raid)) {
            func(raid);
        }
    });
};

/**
 * Get a list of all raid objects (hatched and not hatched) sorted by hatch time.
 */
RaidManager.prototype.list = function (filter) {
    // create sortedRaids array (sorted by hatch time)
    let sortedRaids = [];

    // Object.assign does a shallow copy
    this.forEachRaid((raid) => sortedRaids.push(Object.assign({}, raid)), filter);

    // sort raids by date
    sortedRaids.sort((a, b) => a.hatchTime - b.hatchTime);

    return sortedRaids;
};

/**
 * Get a discord formatted raid list.
 */
RaidManager.prototype.listFormatted = function (filter, headings, options) {
    let raids = this.list(filter);
    return Raid.getFormattedRaidListOutputAsString(raids, headings, options);
};

/**
 * Private function: Refresh raid list to reflect eggs hatching and raids expiring.
 */
RaidManager.prototype.raidListRefresh = function () {
    let changed = false;
    let now = new Date();
    for (let key in this.raids) {
        if (this.raids.hasOwnProperty(key)) {
            let raid = this.raids[key];
            if ((raid.state === Raid.State.egg) && (now >= this.raids[key].hatchTime)) {
                let possibleBosses = this.findBosses((b) => b.tier === `Tier ${raid.tier}`);
                if (possibleBosses.length === 1) {
                    raid.pokemon = possibleBosses[0];
                }

                if (this.logger) {
                    this.logger.log(`[Raid Manager] Raid Egg Hatched: ${key}`);
                }
                raid.state = Raid.State.hatched;

                if (this.hooks) {
                    this.hooks.raidUpdated(raid);
                }
                changed = true;
            }

            if (now > raid.expiryTime) {
                if (this.logger) {
                    this.logger.log(`[Raid Manager] Raid Expired: ${key}`);
                }

                let raid = this.raids[key];
                delete this.raids[key];

                if (this.hooks) {
                    this.hooks.raidRemoved(raid);
                }
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

RaidManager.prototype.updateChannels = function () {
    if (!this.reportingSuspended) {
        this.raidChannels.forEach((channel) => {
            channel.update();
        });
    }
};

RaidManager.prototype.reportRaidsUpdate = function () {
    if (!this.reportingSuspended) {
        this.updateChannels();
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
            gym: raid.gym.key,
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
        let now = Date.now();
        if (saved.expiry > now) {
            let matches = self.gyms.tryGetGymsExact(saved.gym);
            if ((matches !== undefined) && (matches.length > 0)) {
                if (matches.length === 1) {
                    let gym = matches[0].gym;
                    let boss = (saved.boss ? self.bosses.find((b) => b.name === saved.boss) : undefined);
                    let raid = self._forceRaid(gym, saved.tier, boss, new Date(saved.hatch));
                    raid.raiders = restoreRaiders(raid, saved.raiders);

                    if ((!raid.pokemon) && (now >= raid.hatchTime)) {
                        let possibleBosses = this.findBosses((b) => b.tier === `Tier ${raid.tier}`);
                        if (possibleBosses.length === 1) {
                            raid.pokemon = possibleBosses[0];
                            if (this.logger) {
                                this.logger.log(`Hatched: ${Raid.raidToString(raid, raidLogFormat)}\n`);
                            }
                        }
                    }

                    if (this.logger) {
                        this.logger.log(`Restored: ${Raid.raidToString(raid, raidLogFormat)}\n`);
                    }
                }
                else if (this.logger) {
                    this.logger.log(`Couldn't restore raid for ambiguous gym "${saved.gym}"`);
                }
            }
            else if (this.logger) {
                this.logger.log(`Couldn't restore raid for unknown gym "${saved.gym}"`);
            }
        }
        else if (this.logger) {
            this.logger.log(`Expired: ${saved.gym}`);
        }
    });
};

RaidManager.prototype.tryRestoreState = function () {
    if (this.bosses && this.gyms) {
        if (this.restoreFrom && fs.existsSync(this.restoreFrom)) {
            try {
                const restoreFrom = this.restoreFrom;
                this.restoreFrom = undefined;
                if (this.logger) {
                    this.logger.log(`Attempting to restore from ${restoreFrom}`);
                }
                this.reportingSuspended = true;
                this.restoreFromSaveState(JSON.parse(fs.readFileSync(restoreFrom, "utf8")));
                this.reportingSuspended = false;
                this.reportRaidsUpdate();
            }
            catch (e) {
                if (this.logger) {
                    this.logger.log(`Error restoring raid state: ${e}`);
                }
                this.reportingSuspended = false;
            }
        }
        else {
            this.updateChannels();
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
