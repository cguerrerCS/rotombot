"use strict";
const commando = require("discord.js-commando");

const allowedChannel = "faction_assignment";
let valor = ["valor", "v", "red", "r"];
let mystic = ["mystic", "m", "blue", "b"];
let instinct = ["instinct", "i", "yellow", "y"];

//!raids command
class team extends commando.Command {
    constructor(client) {
        super(client, {
            name: "team",
            group: "raids",
            memberName: "team",
            description: "allow users to assign their own team",
            examples: [
                "!team <valor, mystic, instinct>",
                "!team mystic",
                "!team I",
                "!team yellow",
                "!team y",
            ],
        });
    }


    async run(message, args) {
        let client = message.client;
        if (message.channel.type.toString() === "dm") {
            client.reportError(message, "!team", "cannot add a team via DMs.");
            return;
        }

        if (message.channel.guild.name === "RainCityPoGo" && message.channel.name !== allowedChannel) {
            client.reportError(message, "!team", "Teams can only be assigned in the faction_assignment channel");
        }

        let desiredTeam = args.toLowerCase();
        let newTeam = "";
        let existingRole = undefined;

        // see if the string matches any known teams
        if (mystic.indexOf(desiredTeam) > -1) {
            newTeam = "Mystic";
        }
        else if (valor.indexOf(desiredTeam) > -1) {
            newTeam = "Valor";
        }
        else if (instinct.indexOf(desiredTeam) > -1) {
            newTeam = "Instinct";
        }
        else {
            // print out an error
            client.reportError(message, "!team", "Could not find a matching team", this.examples[0]);
            return;
        }

        console.log("new team is: " + newTeam);

        // check if the user already has a team, if so, need to remove that first
        if (message.member.roles.find("name", "Mystic")) {
            existingRole = "Mystic";
        }
        else if (message.member.roles.find("name", "Valor")) {
            existingRole = "Valor";
        }
        else if (message.member.roles.find("name", "Instinct")) {
            existingRole = "Instinct";
        }

        console.log("found existing team: " + existingRole);

        if (existingRole && newTeam === existingRole) {
            let output = " is already a member of: " + newTeam;
            console.log(message.author.username + output);
            message.channel.send(message.author + output);
            return;
        }

        if (existingRole) {
            //remove the role
            console.log("removing " + message.author.username + " from team " + existingRole);
            let myRole = message.channel.guild.roles.find("name", existingRole);

            console.log("role: " + myRole);

            message.member.removeRole(message.channel.guild.roles.find("name", existingRole));
        }

        // assign the new role
        console.log("Adding " + message.author.username + " to team " + newTeam);
        let role = message.channel.guild.roles.find("name", newTeam);
        message.member.addRole(role);

        let output = "Added " + message.author + " to team " + newTeam + "!";
        message.channel.send(output);
    }
}

module.exports = team;
