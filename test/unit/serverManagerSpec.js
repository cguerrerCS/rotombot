"use strict";

const ServerConfigManager = require("../../lib/serverConfigManager");

describe("ServerConfigManager class", () => {
    describe("constructor", () => {
        const goodServerInit = [
            { displayName: "Server 1", guildName: "Discord 1" },
            {
                displayName: "Server 2",
                guildName: "Discord 2",
                gymLookupOptions: {
                    preferredZones: ["Rain City"],
                    preferredCities: ["Redmond", "Rose Hill"],
                },
            },
        ];

        const badServerConfig = [
            {
                expected: /server display name ".*" must be a non-empty string/i,
                configs: [
                    { guildName: "Discord 1" },
                    { displayName: {}, guildName: "Discord 2" },
                    { displayName: "   ", guildName: "Discord 2" },
                    {},
                ],
            },
            {
                expected: /server discord guild name ".*" must be a non-empty string/i,
                configs: [
                    { displayName: "Server 1" },
                    { displayName: "Server 1", guildName: 37 },
                    { displayName: "Server 1", guildName: "   " },
                ],
            },
            {
                expected: /must be supplied as an object/i,
                configs: [
                    { displayName: "Server 1", guildName: "Discord 1", gymLookupOptions: ["Redmond"] },
                    { displayName: "Server 1", guildName: "Discord 1", gymLookupOptions: "Redmond" },
                ],
            },
            {
                expected: /unknown init option/i,
                configs: [
                    { displayName: "Server 1", guildName: "Discord 1", gymLookupOptions: { preferredPlanets: ["this", "that"] } },
                ],
            },
        ];

        it("should initialize from valid initializers", () => {
            const servers = new ServerConfigManager(goodServerInit);
            goodServerInit.forEach((init) => {
                [
                    init.displayName,
                    init.guildName,
                    init.displayName.toUpperCase(),
                    init.guildName.toLowerCase() + "!!!",
                ].forEach((name) => {
                    let server = servers.tryGetServer(name);
                    expect(server.displayName).toBe(init.displayName);
                    expect(server.guildName).toBe(init.guildName);
                    expect(server.getServerOptionsAsConfigured()).toBeDefined();
                    expect(server.getEffectiveServerOptions()).toBeDefined();
                    if (init.gymLookupOptions !== undefined) {
                        expect(server.getServerOptionsAsConfigured()).toEqual(init.gymLookupOptions);
                        expect(server.getEffectiveServerOptions()).not.toEqual(init.gymLookupOptions);
                    }
                });
            });
        });

        it("should allow a server to have the same display name and discord name", () => {
            let configs = [{ displayName: "Server 1", guildName: "Server 1" }];
            expect(() => new ServerConfigManager(configs)).not.toThrow();
        });

        it("should fail to initialize with invalid initializers", () => {
            badServerConfig.forEach((bad) => {
                bad.configs.forEach((config) => {
                    expect(() => new ServerConfigManager([config])).toThrowError(bad.expected);
                });
            });
        });

        it("should fail to initialize with duplicate or conflicting names", () => {
            [
                {
                    expected: /defined more than once/i,
                    configs: [
                        { displayName: "Server 1", guildName: "Discord 1" },
                        { displayName: "Server 1", guildName: "Discord 1a" },
                    ],
                },
                {
                    expected: /referenced more than once/i,
                    configs: [
                        { displayName: "Server 1", guildName: "Discord 1" },
                        { displayName: "Server 2", guildName: "Discord 1" },
                    ],
                },
                {
                    expected: /cannot use ".*" as both display name and guild name/i,
                    configs: [
                        { displayName: "Server 1", guildName: "Discord 1" },
                        { displayName: "Server 2", guildName: "Server 1" },
                    ],
                },
                {
                    expected: /cannot use ".*" as both display name and guild name/i,
                    configs: [
                        { displayName: "Server 1", guildName: "Discord 1" },
                        { displayName: "Discord 1", guildName: "Discord 2" },
                    ],
                },
            ].forEach((test) => {
                expect(() => {
                    return new ServerConfigManager(test.configs);
                }).toThrowError(test.expected);
            });
        });
    });
});
