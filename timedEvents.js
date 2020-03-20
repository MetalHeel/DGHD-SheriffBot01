const sql = require('mssql');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

// Used to check for timed events. Runs every minute.
function processEvents() {
	// Use for debugging.
	// console.log("Process events!");
	
	// Check jail.
	var request = new sql.Request();
	request.query("SELECT jail.*, offenses.sentence FROM jail LEFT JOIN offenses ON jail.offense_name = offenses.name", function (err, result) {
		if (err) {
			console.log(err);
			return;
		}
		
		var finishedSentences = [];
		
		for (var i = 0; i < Object.keys(result.recordset).length; i++) {
			var incarcerationTime = result.recordset[i].incarceration_time;
			var now = new Date().getTime();
			if (now - incarcerationTime >= result.recordset[i].sentence * 60000) {
				finishedSentences.push(result.recordset[i].user_id);
				Sheriff.theSheriff.channel.send("Alright " + utility.encapsulateIdIntoMention(result.recordset[i].user_id) + ", you've served out your sentence. You're free to go.");
			}
		}
		
		if (finishedSentences.length > 0) {
			var finishedSentencesString = "";
			for (var i = 0; i < finishedSentences.length; i++) {
				if (i < finishedSentences.length - 1) {
					finishedSentencesString += finishedSentences[i] + ", ";
				} else {
					finishedSentencesString += finishedSentences[i]
				}
			}
			
			request.query("DELETE FROM jail WHERE user_id IN (" + finishedSentencesString + ")", function (err) {
				if (err) {
					console.log("Failed to clear up sentences [" + finishedSentencesString + "]: " + err);
				}
			});
		}
	});
}

setInterval(processEvents, 60000);