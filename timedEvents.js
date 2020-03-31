const messageVariationTypes = require('./messageVariationTypes.js');
const messaging = require('./messaging.js');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

// Used to check for timed events. Runs every minute.
function processEvents() {
	if (!Sheriff.theSheriff.userId) {
		return;
	}
	
	var now = new Date();
	
	// Use for debugging.
	// console.log(Sheriff.theSheriff.jail);
	
	// Check last accusation.
	if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect && Sheriff.theSheriff.lastAccusationTime) {
		var changeInTime = now.getTime() - Sheriff.theSheriff.lastAccusationTime;
		var replacements = {};
		if (changeInTime >= 60000) {
			replacements[messaging.ACCUSER_MENTION_TOKEN] = utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentAccuser);
			replacements[messaging.ACCUSEE_MENTION_TOKEN] = utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect);
			messaging.sendResponseWithReplacements(messageVariationTypes.NO_CHARGE, replacements);
			Sheriff.theSheriff.currentAccuser = null;
			Sheriff.theSheriff.currentSuspect = null;
			Sheriff.theSheriff.lastAccusationTime = null;
		} else if (changeInTime >= 30000 && changeInTime < 31000) {
			replacements[messaging.STANDARD_USER_MENTION_TOKEN] = utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentAccuser);
			messaging.sendResponseWithReplacements(messageVariationTypes.NO_CHARGE_YET, replacements);
		}
	}
	
	// Check jail.
	var finishedSentences = [];
	Object.keys(Sheriff.theSheriff.jail).forEach(function(inmate) {
		var incarcerationTime = Sheriff.theSheriff.jail[inmate].incarcerationTime;
		if (now.getTime() - incarcerationTime >= Sheriff.theSheriff.jail[inmate].sentence * 60000) {
			finishedSentences.push(inmate);
			var replacements = {};
			replacements[messaging.STANDARD_USER_MENTION_TOKEN] = utility.encapsulateIdIntoMention(inmate);
			messaging.sendResponseWithReplacements(messageVariationTypes.SENTENCE_SERVED, replacements);
		}
		if (finishedSentences.length > 0) {
			for (var i = 0; i < finishedSentences.length; i++) {
				delete Sheriff.theSheriff.jail[finishedSentences[i]];
			}
		}
	});
	
	// Check the last check around the beat.
	if (now.getTime() - Sheriff.theSheriff.lastCheckAroundTheBeat >= Sheriff.theSheriff.timeUntilNextBeatCheck) {
		Sheriff.theSheriff.lastCheckAroundTheBeat = now.getTime();
		Sheriff.theSheriff.timeUntilNextBeatCheck = utility.getRandomNumberBetweenXAndY(Sheriff.theSheriff.timeUntilNextBeatCheckLowerLimit, Sheriff.theSheriff.timeUntilNextBeatCheckHigherLimit);
		if (now.getHours() >= 8 && now.getTime() - Sheriff.theSheriff.lastChatTime < utility.ONE_HOUR_IN_MILLISECONDS) {
			messaging.sendResponse(messageVariationTypes.ON_THE_BEAT);
		}
	}
}

setInterval(processEvents, 1000);