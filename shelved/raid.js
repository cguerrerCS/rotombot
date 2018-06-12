"use strict";

const MAX_EGG_HATCH_TIME = 60;
const MAX_RAID_ACTIVE_TIME = 45;

Raid.RaidStateEnum = Object.freeze({ "egg": 1, "hatched": 2 });
Raid.maxEggHatchTime = MAX_EGG_HATCH_TIME;
Raid.maxRaidActiveTime = MAX_RAID_ACTIVE_TIME;

function getDeltaDate(date, deltaInMinutes) {
    let time = (typeof date === "number") ? date : date.getTime();
    return new Date(time + (deltaInMinutes * 60 * 1000));
}

function getDeltaInMinutes(date1, date2) {
    return (date1.getTime() - date2.getTime()) / (60 * 1000);
}

function formatTimeAmPm(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    let strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
}

var Raid = function (init) {
    if (!init.gym) {
        throw new Error("Raid must specify a gym.");
    }
    this.gym = init.gym;

    if ((!init.pokemon) && (!init.tier)) {
        throw new Error("Raid must specify boss and/or tier.");
    }
    else if ((init.pokemon && init.tier) && (init.pokemon.tier !== init.tier)) {
        throw new Error(`Cannot set ${init.pokemon.boss} as boss of tier ${init.tier} raid.`);
    }
    this.pokemon = init.pokemon;
    this.tier = init.pokemon.tier;

    if (init.spawnTime) {
        this.spawnTime = init.spawnTime;
        this.hatchTime = (init.hatchTime || getDeltaDate(this.spawnTime, MAX_EGG_HATCH_TIME));
        this.expiryTime = (init.expiryTime || getDeltaDate(this.hatchTime, MAX_RAID_ACTIVE_TIME));
    }
    else if (init.hatchTime) {
        this.spawnTime = getDeltaDate(init.hatchTime, -MAX_EGG_HATCH_TIME);
        this.hatchTime = init.hatchTime;
        this.expiryTime = (init.expiryTime || getDeltaDate(this.hatchTime, MAX_RAID_ACTIVE_TIME));
    }
    else if (init.expiryTime) {
        this.expiryTime = init.expiryTime;
        this.hatchTime = getDeltaDate(this.expiryTime, -MAX_RAID_ACTIVE_TIME);
        this.spawnTime = getDeltaDate(this.hatchTime, -MAX_EGG_HATCH_TIME);
    }

    if ((getDeltaInMinutes(this.expiryTime, this.hatchTime) !== MAX_RAID_ACTIVE_TIME)
        || (getDeltaInMinutes(this.hatchTime, this.spawnTime) !== MAX_EGG_HATCH_TIME)) {
        throw new Error(`Invalid times (start: ${formatTimeAmPm(this.spawnTime)}, hatch: ${formatTimeAmPm(this.hatchTime)}, end: ${formatTimeAmPm(this.expiryTime)})`);
    }

    let delta = Date.now() - this.hatchTime.getTime();
    this.state = init.state || (delta > 0 ? Raid.RaidStateEnum.hatched : Raid.RaidStateEnum.egg);
    this.raiders = init.raiders || {};
    return this;
};

Raid.prototype.merge = function (other, strict) {
    if (other.gym && (other.gym !== this.gym)) {
        throw new Error(`Gym mismatch in raid update (${this.gym.name} !== ${other.gym.name}).`);
    }

    if (other.pokemon) {
        if (strict) {
            if (this.pokemon) {
                if (other.pokemon !== this.pokemon) {
                    throw new Error(`Raid at ${this.gym.name} already has a ${this.pokemon.name} boss.`);
                }
            }
            else if (this.tier) {
                if (other.pokemon.tier !== this.tier) {
                    throw new Error(`Cannot add ${other.pokemon.name} as boss of existing tier ${this.tier} raid at ${this.gym.name}`);
                }
            }
        }
        this.pokemon = other.pokemon;
        this.tier = other.pokemon.tier;
    }
    else if (other.tier) {
        if (strict && (this.pokemon || this.tier)) {
            if (this.tier !== other.tier) {
                throw new Error(`Cannot change tier of raid at ${this.gym.name} from ${this.tier} to ${other.tier}.`);
            }
        }
        this.tier = other.tier;
    }

    let hatch = (wantHatchTime instanceof Date) ? wantHatchTime : new FlexTime(wantHatchTime).toDate();
    let spawn = getDeltaDate(hatch, -MAX_EGG_HATCH_TIME);
    let expiry = getDeltaDate(hatch, MAX_RAID_ACTIVE_TIME);
    let delta = Date.now() - hatch.getTime();
    let state = wantState || (delta > 0 ? RaidManager.RaidStateEnum.hatched : RaidManager.RaidStateEnum.egg);

};