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
					if (result.recordset[i].sentence == 1) {
						Sheriff.theSheriff.channel.send("This carries a sentence of " + result.recordset[i].sentence + " minute.");
					} else {
						Sheriff.theSheriff.channel.send("This carries a sentence of " + result.recordset[i].sentence + " minutes.");
					}
					Sheriff.theSheriff.channel.send("Alright " + utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + ", it's time to go to jail.");
					// TODO: Check if person's already in there.
					var query = "INSERT INTO jail (user_id, offense_name, incarceration_time) VALUES ('" + Sheriff.theSheriff.currentSuspect + "', '" + result.recordset[i].name + "', " + new Date().getTime() + ")";
					request.query(query, function (err) {
						Sheriff.theSheriff.currentAccuser = null;
						Sheriff.theSheriff.currentSuspect = null;
						if (err) {
							console.log(err);
							return;
						}
					});
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