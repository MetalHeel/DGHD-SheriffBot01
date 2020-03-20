const sql = require('mssql');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

// Used to check for timed events. Runs every minute.
function processEvents() {
	// Use for debugging.
	// console.log(Sheriff.theSheriff.jail);
	
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