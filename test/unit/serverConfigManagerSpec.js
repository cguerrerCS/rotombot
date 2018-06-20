"use strict";

const ServerConfigManager = require("../../lib/serverConfigManager");

describe("ServerConfigManager class", () => {
    describe("constructor", () => {
        const goodServerInit = [
            { id: "123", displayName: "Server 1", guildName: "Discord 1" },
            {
                id: "124",
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
                expected: /server id ".*" must be a non-empty string/i,
                configs: [
                    { displayName: "Server 2", guildName: "Discord 1" },
                    { id: {}, displayName: "Server 2", guildName: "Discord 2" },
                    { id: ["123"], displayName: "Server 2", guildName: "Discord 2" },
                    { id: "    ", displayName: "Server 2", guildName: "Discord 2" },
                    {},
                ],
            },
            {
                expected: /server display name ".*" must be a non-empty string/i,
                configs: [
                    { id: "123", guildName: "Discord 1" },
                    { id: "123", displayName: {}, guildName: "Discord 2" },
                    { id: "123", displayName: ["Server 1"], guildName: "Discord 2" },
                    { id: "123", displayName: "   ", guildName: "Discord 2" },
                ],
            },
            {
                expected: /server discord guild name ".*" must be a non-empty string/i,
                configs: [
                    { id: "123", displayName: "Server 1" },
                    { id: "123", displayName: "Server 1", guildName: 37 },
                    { id: "123", displayName: "Server 1", guildName: {} },
                    { id: "123", displayName: "Server 1", guildName: ["Discord 1"] },
                    { id: "123", displayName: "Server 1", guildName: "   " },
                ],
            },
            {
                expected: /must be supplied as an object/i,
                configs: [
                    { id: "123", displayName: "Server 1", guildName: "Discord 1", gymLookupOptions: ["Redmond"] },
                    { id: "123", displayName: "Server 1", guildName: "Discord 1", gymLookupOptions: "Redmond" },
                ],
            },
            {
                expected: /unknown init option/i,
                configs: [
                    { id: "123", displayName: "Server 1", guildName: "Discord 1", gymLookupOptions: { preferredPlanets: ["this", "that"] } },
                ],
            },
        ];

        it("should initialize from valid initializers", () => {
            const servers = new ServerConfigManager(goodServerInit);
            goodServerInit.forEach((init) => {
                [
                    init.id,
                    init.displayName,
                    init.guildName,
                    init.displayName.toUpperCase(),
                    init.guildName.toLowerCase() + "!!!",
                ].forEach((name) => {
                    let server = servers.tryGetServer(name);
                    expect(server.id).toBe(init.id);
                    expect(server.displayName).toBe(init.displayName);
                    expect(server.guildName).toBe(init.guildName);
                    expect(server.getOptionsAsConfigured()).toBeDefined();
                    expect(server.getEffectiveOptions()).toBeDefined();
                    if (init.gymLookupOptions !== undefined) {
                        expect(server.getOptionsAsConfigured()).toEqual(init.gymLookupOptions);
                        expect(server.getEffectiveOptions()).not.toEqual(init.gymLookupOptions);
                    }
                });
            });
        });

        it("should allow a server to have the same display name and discord name", () => {
            let configs = [{ id: "123", displayName: "Server 1", guildName: "Server 1" }];
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
                    expected: /server id .* defined more than once/i,
                    configs: [
                        { id: "123", displayName: "Server 1", guildName: "Discord 1" },
                        { id: "123", displayName: "Server 2", guildName: "Discord 2" },
                    ],
                },
                {
                    expected: /server name .* defined more than once/i,
                    configs: [
                        { id: "123", displayName: "Server 1", guildName: "Discord 1" },
                        { id: "124", displayName: "Server 1", guildName: "Discord 1a" },
                    ],
                },
                {
                    expected: /referenced more than once/i,
                    configs: [
                        { id: "123", displayName: "Server 1", guildName: "Discord 1" },
                        { id: "124", displayName: "Server 2", guildName: "Discord 1" },
                    ],
                },
                {
                    expected: /cannot use ".*" as both display name and guild name/i,
                    configs: [
                        { id: "123", displayName: "Server 1", guildName: "Discord 1" },
                        { id: "124", displayName: "Server 2", guildName: "Server 1" },
                    ],
                },
                {
                    expected: /cannot use ".*" as both display name and guild name/i,
                    configs: [
                        { id: "123", displayName: "Server 1", guildName: "Discord 1" },
                        { id: "124", displayName: "Discord 1", guildName: "Discord 2" },
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
