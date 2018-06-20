"use strict";

const UserConfigManager = require("../../lib/userConfigManager");
const ServerConfigManager = require("../../lib/serverConfigManager");
const GymDirectory = require("../../lib/gymDirectory");
const Utils = require("../../lib/utils.js");

describe("UserConfigManager class", () => {
    const goodConfigs = [
        { id: "123", userName: "Fred" },
        { id: "125", userName: "Barney", gymLookupOptions: { preferredCities: ["Bedrock"] } },
    ];

    describe("constructor", () => {
        const badConfigs = [
            {
                configs: [
                    { id: 123, userName: "fred" },
                    { userName: "fred" },
                    { id: [123], userName: "fred" },
                    { id: {}, userName: "fred" },
                    { id: "  ", userName: "fred" },
                ],
                expected: /user id .* must be a non-empty string/i,
            },
            {
                configs: [
                    { id: "123" },
                    { id: "123", userName: {} },
                    { id: "123", userName: undefined },
                    { id: "123", userName: ["fred"] },
                    { id: "123", userName: "   " },
                ],
                expected: /user name .* must be a non-empty string/i,
            },
            {
                configs: [
                    { id: "123", userName: "fred", gymLookupOptions: { preferredCities: "redmond" } },
                ],
                expected: /must be an array/i,
            },
        ];

        it("should return an empty manager when called with no configs", () => {
            let numUsers = 0;
            const ucm = new UserConfigManager();
            expect(ucm).toBeDefined();
            ucm.forEachUser(() => numUsers++);
            expect(numUsers).toBe(0);
        });

        it("should initialize with an array of good configs", () => {
            const ucm = new UserConfigManager(goodConfigs);
            goodConfigs.forEach((config) => {
                expect(ucm.getUser(config.id).userName).toBe(config.userName);
            });
        });

        it("should initialize with an object of good configs", () => {
            let init = {};
            goodConfigs.forEach((config) => {
                init[config.id] = config;
            });

            const ucm = new UserConfigManager(init);
            goodConfigs.forEach((config) => {
                expect(ucm.getUser(config.id).userName).toBe(config.userName);
            });
        });

        it("should throw for bad intiaizers", () => {
            badConfigs.forEach((bad) => {
                bad.configs.forEach((config) => {
                    expect(() => new UserConfigManager([config])).toThrowError(bad.expected);
                });
            });
        });

        it("should throw for duplicate ids", () => {
            const configs = [
                { id: "123", userName: "Fred" },
                { id: "125", userName: "Barney", gymLookupOptions: { preferredCities: ["Bedrock"] } },
                { id: "123", userName: "Wilma", gymLookupOptions: { preferredCities: ["New Rock City"] } },
            ];
            expect(() => new UserConfigManager(configs)).toThrowError(/multiply defined/i);
        });

        it("should not throw for duplicate names", () => {
            const configs = [
                { id: "123", userName: "Fred" },
                { id: "125", userName: "Barney", gymLookupOptions: { preferredCities: ["Bedrock"] } },
                { id: "127", userName: "Fred", gymLookupOptions: { preferredCities: ["New Rock City"] } },
            ];
            expect(new UserConfigManager(configs)).toBeDefined();
        });
    });

    describe("addUser method", () => {
        it("should throw for an invalid initializer", () => {
            const users = new UserConfigManager();
            expect(() => users.addUser({ userName: "bob" })).toThrowError(/user id .* must be a non-empty string/i);
        });

        it("should succeed if no user with matching ID already exists", () => {
            const users = new UserConfigManager();
            expect(users.addUser({ id: "123", userName: "Fred" })).toBeDefined();
        });

        it("should throw if a user with a matching ID already exists", () => {
            const users = new UserConfigManager();
            expect(users.addUser({ id: "123", userName: "Fred" })).toBeDefined();
            expect(() => users.addUser({ id: "123", userName: "Schleprock" })).toThrowError(/multiply defined/i);
        });
    });

    describe("addOrUpdateUser method", () => {
        it("should throw for an invalid initializer", () => {
            const users = new UserConfigManager();
            expect(() => users.addOrUpdateUser({ userName: "bob" })).toThrowError(/user id .* must be a non-empty string/i);
        });

        it("should succeed if no user with matching ID already exists", () => {
            const users = new UserConfigManager();
            expect(users.addOrUpdateUser({ id: "123", userName: "Fred" })).toBeDefined();
        });

        it("should succeed if a user with a matching ID already exists", () => {
            const users = new UserConfigManager();
            expect(users.addOrUpdateUser({ id: "123", userName: "Fred" })).toBeDefined();
            expect(users.addOrUpdateUser({ id: "123", userName: "Schlepprock" })).toBeDefined();
            expect(users.getUser("123").userName).toBe("Schlepprock");
        });
    });

    describe("getEffectiveOptions method", () => {
        const serverInit = [
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

        const servers = new ServerConfigManager(serverInit);
        const server1 = servers.tryGetServer("Server 1");
        const server2 = servers.tryGetServer("Server 2");

        it("should get a fully specified set of options", () => {
            let baseline = GymDirectory.getOptions({});
            [server1, server2].forEach((server) => {
                goodConfigs.forEach((userConfig) => {
                    let userConfigs = new UserConfigManager(goodConfigs);
                    let user = userConfigs.getUser(userConfig.id);
                    expect(user).toBeDefined();

                    let resolved = user.getEffectiveOptions(server);
                    for (let prop in baseline) {
                        if (baseline.hasOwnProperty(prop)) {
                            expect(resolved.hasOwnProperty(prop)).toBe(true);
                        }
                    }
                });
            });
        });

        it("should apply user overrides", () => {
            let baseline = GymDirectory.getOptions({});
            [server1, server2].forEach((server) => {
                goodConfigs.forEach((userConfig) => {
                    let userConfigs = new UserConfigManager(goodConfigs);
                    let user = userConfigs.getUser(userConfig.id);
                    expect(user).toBeDefined();

                    let resolved = user.getEffectiveOptions(server);
                    for (let prop in baseline) {
                        if (user.getOptionsAsConfigured().hasOwnProperty(prop)) {
                            expect(resolved[prop]).toEqual(Utils.normalize(user.gymLookupOptions[prop]));
                        }
                    }
                });
            });
        });

        it("should apply server overrides", () => {
            let baseline = GymDirectory.getOptions({});
            [server1, server2].forEach((server) => {
                goodConfigs.forEach((userConfig) => {
                    let userConfigs = new UserConfigManager(goodConfigs);
                    let user = userConfigs.getUser(userConfig.id);
                    expect(user).toBeDefined();

                    let serverConfig = server.gymLookupOptions;
                    let resolved = user.getEffectiveOptions(server);
                    for (let prop in baseline) {
                        if (serverConfig.hasOwnProperty(prop) && (!user.gymLookupOptions.hasOwnProperty(prop))) {
                            expect(resolved[prop]).toEqual(Utils.normalize(serverConfig[prop]));
                        }
                    }
                });
            });
        });

        it("should return a cached object", () => {
            let userConfigs = new UserConfigManager([{  id: "123", userName: "Fred" }]);
            let user = userConfigs.getUser("123");
            expect(user).toBeDefined();

            let r1 = user.getEffectiveOptions(server1);
            let r2 = user.getEffectiveOptions(server1);
            expect(r1).toBe(r2);
        });
    });

    describe("getUsersByName method", () => {
        it("should return all users with matching names", () => {
            const configs = [
                { id: "123", userName: "Fred" },
                { id: "125", userName: "Barney", gymLookupOptions: { preferredCities: ["Bedrock"] } },
                { id: "127", userName: "Fred", gymLookupOptions: { preferredCities: ["New Rock City"] } },
            ];
            let users = new UserConfigManager(configs);
            expect(users.getUsersByName("Fred").length).toBe(2);
        });

        it("should match on normalized names", () => {
            const configs = [
                { id: "123", userName: "Fred" },
                { id: "125", userName: "Barney", gymLookupOptions: { preferredCities: ["Bedrock"] } },
                { id: "127", userName: "fred", gymLookupOptions: { preferredCities: ["New Rock City"] } },
            ];
            let users = new UserConfigManager(configs);
            expect(users.getUsersByName("Fred").length).toBe(2);
        });
    });

    describe("restore method", () => {
        it("should round trip without loss", () => {
            let orig = new UserConfigManager(goodConfigs);
            let restored = UserConfigManager.restore(orig.getSaveObject());
            expect(restored.users).toEqual(orig.users);
        });

        it("should return an empty config manager if no save object is supplied", () => {
            let restored = UserConfigManager.restore(undefined);
            expect(restored).toBeDefined();
        });

        it("should throw if an object with no users property is supplied", () => {
            expect(() => UserConfigManager.restore({})).toThrowError(/invalid save object/i);
        });
    });
});
