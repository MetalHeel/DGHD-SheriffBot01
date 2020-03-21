const sql = require('mssql');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

// Used to check for timed events. Runs every minute.
function processEvents() {
	// Use for debugging.
	// console.log(Sheriff.theSheriff.jail);
	
	// Check last accusation.
	if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect && Sheriff.theSheriff.lastAccusationTime) {
		var changeInTime = new Date().getTime() - Sheriff.theSheriff.lastAccusationTime;
		if (changeInTime >= 60000) {
			Sheriff.theSheriff.channel.send("Alright " + utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentAccuser) + ", I ain't gonna wait around here all day. " +
				utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + ", get on out of here and stay out of trouble.");
			Sheriff.theSheriff.currentAccuser = null;
			Sheriff.theSheriff.currentSuspect = null;
			Sheriff.theSheriff.lastAccusationTime = null;
		} else if (changeInTime >= 30000 && changeInTime < 40000) {
			Sheriff.theSheriff.channel.send("Listen " + utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentAccuser) + ", you gonna charge this person or not?");
		}
	}
	
	// Check jail.
	var finishedSentences = [];
	Object.keys(Sheriff.theSheriff.jail).forEach(function(inmate) {
		var incarcerationTime = Sheriff.theSheriff.jail[inmate].incarcerationTime;
		var now = new Date().getTime();
		if (now - incarcerationTime >= Sheriff.theSheriff.jail[inmate].sentence * 60000) {
			finishedSentences.push(inmate);
			Sheriff.theSheriff.channel.send("Alright " + utility.encapsulateIdIntoMention(inmate) + ", you've served out your sentence. You're free to go.");
		}
		if (finishedSentences.length > 0) {
			for (var i = 0; i < finishedSentences.length; i++) {
				delete Sheriff.theSheriff.jail[finishedSentences[i]];
			}
		}
	});
}

setInterval(processEvents, 10000);