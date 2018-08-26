"use strict";

const request = require("request");

const Utils = require("./utils");

let HookManager = function (client, config) {
    this.client = client;
    this.hooks = {};
    this.pending = [];
    this.hooks = config || {};
};

HookManager.prototype.raidUpdated = function (raid, onBehalfOf) {
    let hook = this.hooks.raidUpdated;
    if (hook) {
        let report = {
            raid: {
                gym: raid.gym.uid,
                tier: raid.tier,
                hatch: Utils.dateToUnixTimestamp(raid.hatchTime),
                end: Utils.dateToUnixTimestamp(raid.expiryTime),
            },
            reportedBy: {
                id: this.client.user.id,
            },
        };

        if (raid.pokemon) {
            report.raid.boss = raid.pokemon.name;
            report.raid.bossId = raid.pokemon.id;
        }

        if (onBehalfOf) {
            report.reportedBy.onBehalfOf = {
                name: onBehalfOf.username,
                id: onBehalfOf.id,
            };
        }

        this.pending.push({ hook: "raidUpdated", data: report });
        this.fireHooks();
    }
};

HookManager.prototype.raidRemoved = function (raid, onBehalfOf) {
    if (this.hooks.raidRemoved) {
        let report = {
            raid: {
                gym: raid.gym.uid,
            },
            reportedBy: {
                id: this.client.user.id,
            },
        };

        if (onBehalfOf) {
            report.reportedBy.onBehalfOf = {
                name: onBehalfOf.username,
                id: onBehalfOf.id,
            };
        }

        this.pending.push({ hook: "raidRemoved", data: report });
        this.fireHooks();
    }
};

HookManager.prototype.fireHooks = function () {
    if (!this.reporting) {
        this.reporting = true;
        while (this.pending.length > 0) {
            const report = this.pending.shift();
            const hook = this.hooks[report.hook];
            try {
                if (hook) {
                    console.log(`Reporting ${JSON.stringify(report.data)} to ${hook.url} (token=${hook.token})`);
                    if (hook.token) {
                        report.data.token = hook.token;
                    }
                    request.post(hook.url, { json: report.data }, (err, res, body) => {
                        let bodyText = (typeof body === "object") ? JSON.stringify(body) : body;
                        if (err) {
                            console.log(`hook reported err ${err}`);
                        }
                        else {
                            console.log(`hook succeeded with ${res.statusCode} (${bodyText})`);
                        }
                    });
                }
                else {
                    console.log(`Internal error: hook ${report.hook} not found.`);
                }
            }
            catch (err) {
                console.log(`${hook.name}: ${hook.url} (${JSON.stringify(report.data)}) failed with "${err}".`);
            }
        }
        this.reporting = false;
    }
};

module.exports = HookManager;
