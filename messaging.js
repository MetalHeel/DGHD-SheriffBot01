const sql = require('mssql');
const messageVariationTypes = require('./messageVariationTypes.js');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

module.exports = {
	ACCUSEE_MENTION_TOKEN: "${accusee_mention}",
	ACCUSER_MENTION_TOKEN: "${accuser_mention}",
	SENTENCE_TOKEN: "${sentence}",
	STANDARD_USER_MENTION_TOKEN: "${user_mention}",
	USERNAME_TOKEN: "${username}",
	
	sendResponse: function(messageType) {
		var request = new sql.Request();
		request.query("SELECT variation FROM message_variation WHERE message_type = '" + messageType + "'", function (err, result) {
			if (err) {
				console.log(err);
				return;
			}
			var choice = utility.getRandomNumberBetweenXAndY(0, Object.keys(result.recordset).length - 1);
			Sheriff.theSheriff.channel.send(result.recordset[choice].variation);
		});
	},
	
	sendResponseWithReplacements: function(messageType, replacements) {
		var request = new sql.Request();
		request.query("SELECT variation FROM message_variation WHERE message_type = '" + messageType + "'", function (err, result) {
			if (err) {
				console.log(err);
				return;
			}
			var choice = utility.getRandomNumberBetweenXAndY(0, Object.keys(result.recordset).length - 1);
			var variation = result.recordset[choice].variation;
			if (replacements) {
				Object.keys(replacements).forEach(function(token) {
					variation = variation.replace(token, replacements[token]);
				});
			}
			Sheriff.theSheriff.channel.send(variation);
		});
	},
	
	processPossibleAccusation: function(possibleCrime) {
		var request = new sql.Request();
		var offense = null;
		request.query("SELECT name, sentence FROM offense", function (err, result) {
			if (err) {
				console.log(err);
				Sheriff.theSheriff.currentAccuser = null;
				Sheriff.theSheriff.currentSuspect = null;
				Sheriff.theSheriff.lastAccusationTime = null;
				return;
			}
			for (var i = 0; i < Object.keys(result.recordset).length; i++) {
				if (possibleCrime.toLowerCase().includes(result.recordset[i].name.toLowerCase())) {
					var replacements = {};
					replacements[module.exports.STANDARD_USER_MENTION_TOKEN] = utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect);
					replacements[module.exports.SENTENCE_TOKEN] = result.recordset[i].sentence;
					if (Sheriff.theSheriff.currentSuspect in Sheriff.theSheriff.jail) {
						if (Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].sentence > result.recordset[i].sentence) {
							module.exports.sendResponseWithReplacements(messageVariationTypes.LONGER_SENTENCE, replacements);
						} else if (Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].sentence == result.recordset[i].sentence) {
							module.exports.sendResponseWithReplacements(messageVariationTypes.EQUAL_SENTENCE, replacements);
						} else {
							Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].sentence = result.recordset[i].sentence;
							module.exports.sendResponseWithReplacements(messageVariationTypes.SHORTER_SENTENCE, replacements);
						}
					} else {
						if (result.recordset[i].sentence == 1) {
							Sheriff.theSheriff.channel.send("This carries a sentence of " + result.recordset[i].sentence + " minute.");
						} else {
							Sheriff.theSheriff.channel.send("This carries a sentence of " + result.recordset[i].sentence + " minutes.");
						}
						module.exports.sendResponseWithReplacements(messageVariationTypes.GO_TO_JAIL, replacements);
						Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect] = {};
						Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].offense = result.recordset[i].name;
						Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].sentence = result.recordset[i].sentence;
						Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].incarcerationTime = new Date().getTime();
					}
					Sheriff.theSheriff.currentAccuser = null;
					Sheriff.theSheriff.currentSuspect = null;
					Sheriff.theSheriff.lastAccusationTime = null;
					return;
				}
			}
			var replacements = {};
			replacements[module.exports.STANDARD_USER_MENTION_TOKEN] = utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect);
			module.exports.sendResponseWithReplacements(messageVariationTypes.NOT_A_CRIME, replacements);
			Sheriff.theSheriff.currentAccuser = null;
			Sheriff.theSheriff.currentSuspect = null;
			Sheriff.theSheriff.lastAccusationTime = null;
		});
	}
}