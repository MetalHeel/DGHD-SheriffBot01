const sql = require('mssql');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

module.exports = {
	processHowdy: function() {
		Sheriff.theSheriff.channel.send("Howdy, partner");
	},
	
	processPossibleAccusation(possibleCrime) {
		var request = new sql.Request();
		var offense = null;
		request.query("SELECT name, sentence FROM offenses", function (err, result) {
			if (err) {
				console.log(err);
				Sheriff.theSheriff.currentAccuser = null;
				Sheriff.theSheriff.currentSuspect = null;
				return;
			}
			
			for (var i = 0; i < Object.keys(result.recordset).length; i++) {
				if (possibleCrime.toLowerCase().includes(result.recordset[i].name.toLowerCase())) {
					if (Sheriff.theSheriff.currentSuspect in Sheriff.theSheriff.jail) {
						if (Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].sentence > result.recordset[i].sentence) {
							// TODO: Stack sentencing?
							Sheriff.theSheriff.channel.send(utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + " is already carrying out a longer sentence. We'll call that time served.");
						} else {
							// TODO: Maybe call out sentences here as well.
							Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].sentence = result.recordset[i].sentence;
							Sheriff.theSheriff.channel.send("Welp " + utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + ", looks like you just got a longer sentence.");
						}
					} else {
						if (result.recordset[i].sentence == 1) {
							Sheriff.theSheriff.channel.send("This carries a sentence of " + result.recordset[i].sentence + " minute.");
						} else {
							Sheriff.theSheriff.channel.send("This carries a sentence of " + result.recordset[i].sentence + " minutes.");
						}
						Sheriff.theSheriff.channel.send("Alright " + utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + ", it's time to go to jail.");
						Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect] = {};
						Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].offense = result.recordset[i].name;
						Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].sentence = result.recordset[i].sentence;
						Sheriff.theSheriff.jail[Sheriff.theSheriff.currentSuspect].incarcerationTime = new Date().getTime();
					}
					Sheriff.theSheriff.currentAccuser = null;
					Sheriff.theSheriff.currentSuspect = null;
					return;
				}
			}
			
			Sheriff.theSheriff.channel.send("Sorry partner, that ain't against the law. Alright " + utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + ", you're free to go.");
			
			Sheriff.theSheriff.currentAccuser = null;
			Sheriff.theSheriff.currentSuspect = null;
		});
	},
	
	processThankYouForYourService() {
		Sheriff.theSheriff.channel.send("'Preciate that, partner.");
	}
}