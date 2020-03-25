const sql = require('mssql');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

module.exports = {
	ARREST: 'arrest',
	COMMANDS: 'commands',
	CURRENT_SUSPECT: 'currentsuspect',
	MEOW: 'meow',
	OFFENSES: 'offenses',
	ROLL_D: 'rolld',
	WHOS_IN_JAIL: 'whosinjail',
	
	processArrest: function(accuser, accusee) {
		// NOTE: The hard-coded ID is for the stream bot. This may change, keep an eye on it.
		if (!accusee || accusee.id === "446844790588571674") {
			Sheriff.theSheriff.channel.send("That ain't a person, ya chuckle head.");
			return;
		}
		
		if (accusee.id === Sheriff.theSheriff.userId) {
			Sheriff.theSheriff.channel.send("Now why would I go and arrest myself? I ain't done nothin' wrong.");
			return;
		}
		
		if (accusee.id === accuser.id) {
			Sheriff.theSheriff.channel.send("You want to arrest yourself, partner? That's a bit asinine.");
			return;
		}
		
		if (accusee.id === Sheriff.theSheriff.currentSuspect) {
			Sheriff.theSheriff.channel.send("Listen, I'm already working on it. Quit buggin' me.");
			return;
		}
		
		if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect) {
			Sheriff.theSheriff.channel.send("I'm already working on a got dang case. Wait in line.");
			return;
		}
		
		Sheriff.theSheriff.currentAccuser = accuser.id;
		Sheriff.theSheriff.currentSuspect = accusee.id;
		Sheriff.theSheriff.lastAccusationTime = new Date().getTime();
		
		Sheriff.theSheriff.channel.send("You want to put " + utility.encapsulateIdIntoMention(accusee) + " in jail? On what charges?");
	},
	
	processCommands: function() {
		Sheriff.theSheriff.channel.send("Just go on and add '!' to the front of these:\n" + this.ARREST + "\n" + this.CURRENT_SUSPECT + "\n" + this.MEOW + "\n" + this.OFFENSES + "\n" + this.ROLL_D + "\n" + this.WHOS_IN_JAIL);
	},
	
	processCurrentSuspect: function() {
		if (!Sheriff.theSheriff.currentAccuser && !Sheriff.theSheriff.currentSuspect) {
			Sheriff.theSheriff.channel.send("All's quiet on the prairie. No crimes here.");
			return;
		}
		
		Sheriff.theSheriff.channel.send(utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentAccuser) + " seems to think " +
			utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + " has committed a crime.");
	},
	
	processMeow: function() {
		Sheriff.theSheriff.channel.send("I ain't no got dang cat.");
	},
	
	processOffenses: function() {
		var request = new sql.Request();
		request.query("SELECT name, sentence FROM offense ORDER BY name ASC", function (err, result) {
			if (err) {
				console.log(err);
				Sheriff.theSheriff.currentAccuser = null;
				Sheriff.theSheriff.currentSuspect = null;
				Sheriff.theSheriff.lastAccusationTime = null;
				return;
			}
			
			var length = Object.keys(result.recordset).length;
			var output = "";
			
			for (var i = 0; i < length; i++) {
				if (result.recordset[i].sentence == 1) {
					output += result.recordset[i].name + " (" + result.recordset[i].sentence + " minute)";
				} else {
					output += result.recordset[i].name + " (" + result.recordset[i].sentence + " minutes)";
				}
				if (i < length - 1) {
					output += "\n";
				}
			}
			
			Sheriff.theSheriff.channel.send(output);
		});
	},
	
	processRollDX(numberOfSidesString) {
		var sides = Number(numberOfSidesString);
		if (isNaN(sides) || !Number.isInteger(sides)) {
			Sheriff.theSheriff.channel.send("I'm afraid that's not a good number, partner.");
			return;
		}
		if (sides == 0) {
			Sheriff.theSheriff.channel.send("A zero dice? Heck am I supposed to do with that? You got tumbleweed for brains?");
			return;
		}
		if (sides < 0) {
			Sheriff.theSheriff.channel.send("Ain't no such thing as a negative dice, ya idjit.");
			return;
		}
		if (sides == 1) {
			Sheriff.theSheriff.channel.send("Alright partner, you tell me: How in tarnation does something have one side? I s'pose a sphere has \"one side\", but you're only ever going to get one with it anyway, so what's the point?");
			return;
		}
		var roll = utility.getRandomNumberBetweenXAndY(1, sides);
		if (sides == 2) {
			if (roll == 1) {
				Sheriff.theSheriff.channel.send("Looks like you got heads partner.");
			} else {
				Sheriff.theSheriff.channel.send("Looks like you got tails partner.");
			}
		} else {
			Sheriff.theSheriff.channel.send("Looks like you rolled a " + roll + " partner.");
		}
	},
	
	processWhosInJail: function() {
		var inmateList = "";
		if (Object.keys(Sheriff.theSheriff.jail).length == 0) {
			Sheriff.theSheriff.channel.send("Jail's empty, partner.");
			return;
		}
		Object.keys(Sheriff.theSheriff.jail).forEach(function(inmate) {
			inmateList += utility.encapsulateIdIntoMention(inmate) + " is in jail for " + Sheriff.theSheriff.jail[inmate].offense + ".\n";
		});
		inmateList += "And that's about it.";
		Sheriff.theSheriff.channel.send(inmateList);
	}
}