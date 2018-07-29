"use strict";

const fs = require("fs");
const path = require("path");

const request = require("request");

const Utils = require("./utils");

let HookManager = function (client, dataRoot) {
    this.client = client;
    this.hooks = {};
    this.pending = [];
    let initPath = path.resolve(dataRoot, client.botName, "WebHooks.json");
    if (fs.existsSync(initPath)) {
        this.hooks = require(initPath);
    }
};

HookManager.prototype.raidUpdated = function (raid, onBehalfOf) {
    if (this.hooks.raidUpdated) {
        let report = {
            gym: raid.gym.uid,
            tier: raid.tier,
            hatch: Utils.formatTime24Hours(raid.hatchTime),
            end: Utils.formatTime24Hours(raid.expiryTime),
            reportedBy: this.client.user.id,
        };

        if (raid.pokemon) {
            report.boss = raid.pokemon.name;
        }

        if (onBehalfOf) {
            report.onBehalfOf = onBehalfOf;
        }

        this.pending.push({ hook: "raidUpdated", data: { raid: report } });
        this.fireHooks();
    }
};

HookManager.prototype.raidRemoved = function (raid, onBehalfOf) {
    if (this.hooks.raidRemoved) {
        let report = {
            gym: raid.gym.uid,
        };

        if (onBehalfOf) {
            report.reportedBy = onBehalfOf;
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
                    console.log(`Reporting ${JSON.stringify(report.data)} to ${hook.url}`);
                    request.post(hook.url, { json: report.data }, (err, res, body) => {
                        if (err) {
                            console.log(`hook reported err ${err}`);
                        }
                        else {
                            console.log(`hook succeeded with ${res.statusCode} (${body})`);
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
