const sql = require('mssql');
const messageVariationTypes = require('./messageVariationTypes.js');
const messaging = require('./messaging.js');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

module.exports = {
	ARREST: 'arrest',
	COMMANDS: 'commands',
	CURRENT_SUSPECT: 'currentsuspect',
	MEOW: 'meow',
	OFFENSES: 'offenses',
	ROLL_D: 'rolld',
	TOGGLE_PATROL: 'togglepatrol',
	WHOS_IN_JAIL: 'whosinjail',
	
	processArrest: function(accuser, accusee) {
		// NOTE: The hard-coded ID is for the stream bot. This may change, keep an eye on it.
		if (!accusee || accusee.id === "446844790588571674") {
			messaging.sendResponse(messageVariationTypes.NOT_A_PERSON);
			return;
		}
		
		if (accusee.id === Sheriff.theSheriff.userId) {
			messaging.sendResponse(messageVariationTypes.ARREST_SHERIFF);
			return;
		}
		
		if (accusee.id === accuser.id) {
			messaging.sendResponse(messageVariationTypes.ARREST_SELF);
			return;
		}
		
		if (accusee.id === Sheriff.theSheriff.currentSuspect) {
			messaging.sendResponse(messageVariationTypes.ARREST_CURRENT_SUSPECT);
			return;
		}
		
		if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect) {
			messaging.sendResponse(messageVariationTypes.ALREADY_WORKING);
			return;
		}
		
		Sheriff.theSheriff.currentAccuser = accuser.id;
		Sheriff.theSheriff.currentSuspect = accusee.id;
		Sheriff.theSheriff.lastAccusationTime = new Date().getTime();
		
		var replacements = {};
		replacements[messaging.STANDARD_USER_MENTION_TOKEN] = utility.encapsulateIdIntoMention(accusee);
		messaging.sendResponseWithReplacements(messageVariationTypes.SUCCESSFUL_ARREST, replacements);
	},
	
	processCommands: function() {
		Sheriff.theSheriff.channel.send("Just go on and add '!' to the front of these:\n" + this.ARREST + "\n" + this.CURRENT_SUSPECT + "\n" + this.MEOW + "\n" + this.OFFENSES + "\n" + this.ROLL_D + "\n" + this.WHOS_IN_JAIL);
	},
	
	processCurrentSuspect: function() {
		if (!Sheriff.theSheriff.currentAccuser && !Sheriff.theSheriff.currentSuspect) {
			messaging.sendResponse(messageVariationTypes.NO_CRIMES);
			return;
		}
		var replacements = {};
		replacements[messaging.ACCUSER_MENTION_TOKEN] = utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentAccuser);
		replacements[messaging.ACCUSEE_MENTION_TOKEN] = utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect);
		messaging.sendResponseWithReplacements(messageVariationTypes.CURRENT_SUSPECT, replacements);
	},
	
	processMeow: function() {
		messaging.sendResponse(messageVariationTypes.MEOW_RESPONSE);
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
			messaging.sendResponse(messageVariationTypes.BAD_NUMBER);
			return;
		}
		if (sides == 0) {
			messaging.sendResponse(messageVariationTypes.ZERO_DICE);
			return;
		}
		if (sides < 0) {
			messaging.sendResponse(messageVariationTypes.NEGATIVE_DICE);
			return;
		}
		if (sides == 1) {
			messaging.sendResponse(messageVariationTypes.ONE_SIDE_DIE);
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
	
	processTogglePatrol() {
		// TODO: Make responses varied.
		Sheriff.theSheriff.patrol = !Sheriff.theSheriff.patrol;
		if (Sheriff.theSheriff.patrol) {
			Sheriff.theSheriff.channel.send("Alright, alright. I'll get to steppin'.");
		} else {
			Sheriff.theSheriff.channel.send("Time for a break huh? Sounds good to me, no more patrols.");
		}
	},
	
	processWhosInJail: function() {
		var inmateList = "";
		if (Object.keys(Sheriff.theSheriff.jail).length == 0) {
			messaging.sendResponse(messageVariationTypes.EMPTY_JAIL);
			return;
		}
		Object.keys(Sheriff.theSheriff.jail).forEach(function(inmate) {
			inmateList += utility.encapsulateIdIntoMention(inmate) + " is in jail for " + Sheriff.theSheriff.jail[inmate].offense + ".\n";
		});
		inmateList += "And that's about it.";
		Sheriff.theSheriff.channel.send(inmateList);
	}
}