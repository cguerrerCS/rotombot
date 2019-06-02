"use strict";

const request = require("request");

const Utils = require("./utils");

let HookManager = function (client, config) {
    this.client = client;
    this.hooks = {};
    this.pending = [];
    this.hooks = config || {};
    this.health = {};
};

HookManager.prototype.raidUpdated = function (raid, onBehalfOf) {
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
};

HookManager.prototype.raidRemoved = function (raid, onBehalfOf) {
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
};

function tryFireHookOnProvider(report, provider, status) {
    let hookUrl = (provider && provider.urls) ? provider.urls[report.hook] : undefined;

    if (hookUrl) {
        status.providers.push(provider.name);
        provider.health = provider.health || { success: 0, failure: 0 };
        try {
            console.log(`${provider.name}: Reporting ${JSON.stringify(report.data)} to ${hookUrl} (token=${provider.token})`);
            if (provider.token) {
                report.data.token = provider.token;
            }
            request.post(hookUrl, { json: report.data }, (err, res, body) => {
                let bodyText = (typeof body === "object") ? JSON.stringify(body) : body;
                if (err) {
                    provider.health.failure++;
                    console.log(`${provider.name}: ${hookUrl} reported error ${err}`);
                }
                else if (res.status >= 400) {
                    provider.health.failure++;
                    console.log(`${provider.name}: ${hookUrl} reported failure status ${res.statusCode} (${bodyText})`);
                }
                else {
                    provider.health.success++;
                    console.log(`${provider.name}: ${hookUrl} succeeded with ${res.statusCode} (${bodyText})`);
                }
            });
        }
        catch (err) {
            provider.health.failure++;
            console.log(`${provider.name}: ${hookUrl} threw exception "${err}".`);
        }
    }
    return status;
}

HookManager.prototype.fireHooks = function () {
    if (!this.reporting) {
        this.reporting = true;
        while (this.pending.length > 0) {
            let status = { providers: [] };
            const report = this.pending.shift();
            this.hooks.forEach((provider) => tryFireHookOnProvider(report, provider, status));

            if (status.providers.length < 1) {
                console.log(`No providers configured for ${report.hook}`);
            }
        }
        this.reporting = false;
    }
};

HookManager.getHookProviderHealth = function (provider) {
    let health = provider ? provider.health : undefined;
    if (health && ((health.success > 0) || (health.failure > 0))) {
        return health.success / (health.success + health.failure);
    }
    return undefined;
};

HookManager.prototype.getMessages = function (name) {
    let messages = [];
    if (this.hooks && Array.isArray(this.hooks)) {
        this.hooks.forEach((provider) => {
            if (provider.messages && provider.messages[name]) {
                const health = HookManager.getHookProviderHealth(provider);
                if (health && health > 0.75) {
                    messages.push(provider.messages[name]);
                }
            }
        });
    }
    return messages;
};

module.exports = HookManager;
