const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

module.exports = {
	processPossibleAccusation(sql, channel, possibleCrime) {
		var request = new sql.Request();
		request.query("SELECT name, sentence FROM offenses", function (err, result) {
			// TODO: Check for errors.
			
			var length = Object.keys(result.recordset).length;
			
			for (var i = 0; i < length; i++) {
				if (possibleCrime.toLowerCase().includes(result.recordset[i].name.toLowerCase())) {
					channel.send("This carries a sentence of " + result.recordset[i].sentence + " units of time yet to be determined.");
					channel.send("Alright " + utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + ", it's time to go to jail...huh. Seems like I ain't got one.");
					Sheriff.theSheriff.currentAccuser = null;
					Sheriff.theSheriff.currentSuspect = null;
					Sheriff.theSheriff.currentCrime = null;
					return;
				}
			}
			
			channel.send("Sorry partner, that ain't against the law. Alright " + utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + ", you're free to go.");
			
			Sheriff.theSheriff.currentAccuser = null;
			Sheriff.theSheriff.currentSuspect = null;
			Sheriff.theSheriff.currentCrime = null;
		});
	},
	
	processHowdy: function(channel) {
		channel.send("Howdy, partner");
	}
}