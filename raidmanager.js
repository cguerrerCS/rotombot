function RaidManager() {

    const MAX_EGG_HATCH_TIME = 60;
    const MAX_RAID_ACTIVE_TIME = 45;
    var Raids = {};
    var RaidStateEnum = Object.freeze({"egg":1, "hatched":2});

    this.removeRaid = function (location) {

      if (location in Raids)
      {
        delete Raids[location];
      } else {
        throw "cannot remove raid from unreported raid location."
      }
    }

    /**
     * Add a raid in hatched state.
     * @param {String} var Pokemon species.
     * @param {String} var Raid Location Gym Name.
     * @param {Int}    var Number of minutues until raid hatch.
     */
    this.addRaid = function(pkmn, tier, location, minutes) {

      if ( isNaN(tier) )
      {
        throw "raid tier is NaN.";
      }

      if ( tier < 1 || tier > 5 )
      {
        throw "raid tier cannot be [" + minutes + "].";
      }

      // make sure valid # of minutes for hatch countdown are provided
      if ( isNaN(minutes) )
      {
        throw "raid minute expiry countdown is NaN.";
      }

      // convert any string format numbers to int
      tier = parseInt(tier);
      minutes = parseInt(minutes);

      // error check bounds
      if (minutes < 0 || minutes > MAX_RAID_ACTIVE_TIME)
      {
        throw "raid cannot have [" + minutes + "] minutes left.";
      }

      // default time today's month and year
      var now = new Date();

			var expiryTime = new Date();
      expiryTime.setMinutes(now.getMinutes() + minutes);

      var hatchTime = new Date();
      hatchTime.setMinutes(expiryTime.getMinutes() - MAX_RAID_ACTIVE_TIME);

      var spawnTime = new Date();
      spawnTime.setMinutes(hatchTime.getMinutes() - MAX_EGG_HATCH_TIME);

      // TODO: resolve raid tier based off of pkmn species here instead
      // ...
      // ...

      var raid = {
        Tier: tier,
        Pokemon: pkmn,
        RaidLocation: location,
        State: RaidStateEnum.hatched,
        SpawnTime: spawnTime,
        HatchTime: hatchTime,
        ExpiryTime: expiryTime
      };

      Raids[raid.RaidLocation] = raid;
    }

    /**
     * Set raid boss for an unhatched gym.
     * @param {String} var Pokemon species raid boss.
     * @param {String} var Raid Location Gym Name.
     */
    this.setRaidBoss = function(pkmn, tier, location) {

      if ( isNaN(tier) )
      {
        throw "raid tier is NaN.";
      }

      // convert any string format numbers to int
      tier = parseInt(tier);

      if ( tier < 1 || tier > 5 )
      {
        throw "raid tier cannot be [" + minutes + "].";
      }

      if (location in Raids)
      {
        var raid = Raids[location];
        if (raid.State === RaidStateEnum.hatched) {
          raid.Pokemon = pkmn;
          raid.Tier = tier;
        } else {
          throw "cannot set raid boss for unhatched egg."
        }

      } else {
        throw "cannot set raid boss of unreported raids."
      }
    }

    /**
     * Add a raid in egg state.
     * @param {String} var Raid Location Gym Name.
     * @param {Int} var Number of minutues until raid hatch (countdown).
     */
    this.addEggCountdown = function(tier, location, minutes) {

      if ( isNaN(tier) )
      {
        throw "raid tier is NaN.";
      }

      // make sure valid # of minutes for hatch countdown are provided
      if ( isNaN(minutes) )
      {
        throw "egg minute countdown is NaN.";
      }

      // convert any string format numbers to int
      tier = parseInt(tier);
      minutes = parseInt(minutes);

      if ( tier < 1 || tier > 5 )
      {
        throw "raid tier cannot be [" + minutes + "].";
      }

      // error check bounds
      if (minutes < 0 || minutes > MAX_EGG_HATCH_TIME)
      {
        throw "egg cannot hatch in [" + minutes + "] minutes.";
      }

      // default time today's month and year
      var now = new Date();

      var hatchTime = new Date();
      hatchTime.setMinutes(now.getMinutes() + minutes);

      var spawnTime = new Date();
      spawnTime.setMinutes(hatchTime.getMinutes() - MAX_EGG_HATCH_TIME);

      var expiryTime = new Date();
      expiryTime.setMinutes(hatchTime.getMinutes() + MAX_RAID_ACTIVE_TIME);

      var raid = {
        Tier: tier,
        Pokemon: "Unknown",
        RaidLocation: location,
        State: RaidStateEnum.egg,
        SpawnTime: spawnTime,
        HatchTime: hatchTime,
        ExpiryTime: expiryTime
      };

      Raids[raid.RaidLocation] = raid;
    }

    /**
     * Add a raid in egg state.
     * @param {String} var Raid Location Gym Name.
     * @param {Date} var Hatchtime in Date format.
     */
    this.addEggAbsolute = function(tier, location, hatchTime) {

      if ( isNaN(tier) )
      {
        throw "raid tier countdown is NaN.";
      }

      // convert any string format numbers to int
      tier = parseInt(tier);

      if ( tier < 1 || tier > 5 )
      {
        throw "raid tier cannot be [" + minutes + "].";
      }

      if (!(hatchTime instanceof Date))
      {
          throw "provided hatchtime not instance of Date.";
      }

      // TODO: validate hatch time
      // TODO: error check hatchtime range, can just ask user to report raid instead (if already hatched)
      // TODO: max and min prediction time calculations

      var spawnTime = new Date();
      spawnTime.setMinutes(hatchTime.getMinutes() - MAX_EGG_HATCH_TIME);

      var expiryTime = new Date();
      expiryTime.setMinutes(hatchTime.getMinutes() + MAX_RAID_ACTIVE_TIME);

      var raid = {
        Tier: tier,
        Pokemon: "Unknown",
        RaidLocation: location,
        State: RaidStateEnum.egg,
        SpawnTime: spawnTime,
        HatchTime: hatchTime,
        ExpiryTime: expiryTime
      };

      Raids[raid.RaidLocation] = raid;
    }

    /**
     * Get a list of all raid objects (hatched and not hatched) sorted by hatch time.
     */
    this.list = function() {

      // create sortedRaids array (sorted by hatch time)
      var sortedRaids = new Array();
      for (var key in Raids)
      {
        // this copy method will not work for nested objects
        var raidObj = Raids[key];
        var raidObjCopy = Object.assign({}, raidObj);
        sortedRaids.push(raidObjCopy);
      }

      // sort raids by date
      sortedRaids.sort(function(a,b)
      {
          return a.HatchTime - b.HatchTime;
      });

      return sortedRaids;
    }

    /**
     * Get a discord formatted raid list.
     */
    this.listFormatted = function() {

      var raidListMarkupRaidActive = [];
      var raidListMarkupRaidUpcoming = [];
      raidListMarkupRaidActive.push("__**ACTIVE RAIDS**__\n");
      raidListMarkupRaidUpcoming.push("__**UPCOMING RAIDS**__\n");

      var sortedRaids = this.list();
      for (var i = 0; i < sortedRaids.length; i++)
      {
        var raid = sortedRaids[i];
        var tierStringEgg = "T" + raid.Tier;
        var tierStringHatched = "T" + raid.Tier;
        if (raid.State === RaidStateEnum.egg) {
          raidListMarkupRaidUpcoming.push("[" + tierStringEgg +  "] " + raid.RaidLocation + " @ " + FormatDateAMPM(raid.HatchTime) + "\n");

        } else if (raid.State === RaidStateEnum.hatched) {
          raidListMarkupRaidActive.push("[" + tierStringHatched + " " + raid.Pokemon + "] " + raid.RaidLocation + " @ " + FormatDateAMPM(raid.HatchTime) + "\n");
        }
      }

      var output = "";
      if ((raidListMarkupRaidActive.length === 1) && (raidListMarkupRaidUpcoming.length === 1))
      {
        output = "*No raids to report.*"
      }

      if (raidListMarkupRaidActive.length > 1)
      {
        output = output + raidListMarkupRaidActive.join("");
      }

      if ((raidListMarkupRaidUpcoming.length > 1) && (raidListMarkupRaidActive.length > 1))
      {
        output = output + "\n" + raidListMarkupRaidUpcoming.join("");
      }
      else if ((raidListMarkupRaidUpcoming.length > 1) && (raidListMarkupRaidActive.length === 1))
      {
        output = output + raidListMarkupRaidUpcoming.join("");
      }

      return output;
    }

    /**
     * Private function: Convert DataTime to readable format.
     */
    function FormatDateAMPM(date)
    {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+ minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    }

    /**
     * Private function: Refresh raid list to reflect eggs hatching and raids expiring.
     */
    function RaidListRefresh() {
      var now = new Date();
      for (var key in Raids)
      {
        var raid = Raids[key];
        if ((raid.State === RaidStateEnum.egg) && (now >= Raids[key].HatchTime))
        {
          console.log("[Raid Manager] Raid Egg Hatched: " + key);
          raid.State = RaidStateEnum.hatched;
        }

        if (now > raid.ExpiryTime)
        {
          console.log("[Raid Manager] Raid Expired: " + key);
          delete Raids[key];
        }
      }
    }

    // raid list refresh logic, recurr every 10 seconds
    setInterval(RaidListRefresh, 10 * 1000);
}

module.exports = RaidManager;
