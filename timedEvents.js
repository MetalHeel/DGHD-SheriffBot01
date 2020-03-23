const messageVariationTypes = require('./messageVariationTypes.js');
const sql = require('mssql');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

// Used to check for timed events. Runs every minute.
function processEvents() {
	// Use for debugging.
	// console.log(Sheriff.theSheriff.jail);
	
	var now = new Date();
	
	// Check last accusation.
	if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect && Sheriff.theSheriff.lastAccusationTime) {
		var changeInTime = now.getTime() - Sheriff.theSheriff.lastAccusationTime;
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
		if (now.getTime() - incarcerationTime >= Sheriff.theSheriff.jail[inmate].sentence * 60000) {
			finishedSentences.push(inmate);
			Sheriff.theSheriff.channel.send("Alright " + utility.encapsulateIdIntoMention(inmate) + ", you've served out your sentence. You're free to go.");
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
		Sheriff.theSheriff.timeUntilNextBeatCheck = Math.floor(Math.random() * Math.floor(1800000)) + 1200000;
		if (now.getHours() >= 8 && now.getHours <= 23) {
			var request = new sql.Request();
			request.query("SELECT variation FROM message_variation WHERE message_type = '" + messageVariationTypes.ON_THE_BEAT + "'", function (err, result) {
				if (err) {
					console.log(err);
					return;
				}
				
				var choice = Math.floor(Math.random() * Math.floor(Object.keys(result.recordset).length - 1));
				
				Sheriff.theSheriff.channel.send(result.recordset[choice].variation);
			});
		}
	}
	
}

setInterval(processEvents, 10000);