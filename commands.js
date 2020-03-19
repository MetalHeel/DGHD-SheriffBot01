const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

module.exports = {
	processArrest: function(channel, accuser, accusee) {
		if (accusee.id === Sheriff.theSheriff.userId) {
			channel.send("Now why would I go and arrest myself? I ain't done nothin' wrong.");
			return;
		}
				
		if (!accusee) {
			channel.send("That ain't a person, ya chuckle head.");
			return;
		}
		
		if (accusee.id === accuser.id) {
			channel.send("You want to arrest yourself, partner? That's a bit asinine.");
			return;
		}
		
		Sheriff.theSheriff.currentAccuser = accuser.id;
		Sheriff.theSheriff.currentSuspect = accusee.id;
		
		channel.send("You want to put " + utility.encapsulateIdIntoMention(accusee) + " in jail? On what charges?");
	},
	
	processMeow: function(channel) {
		channel.send("I ain't no got dang cat.");
	},
	
	processOffenses: function(sql, channel) {
		var request = new sql.Request();
		request.query("SELECT name FROM offenses", function (err, result) {
			// TODO: Check for errors.
			
			var length = Object.keys(result.recordset).length;
			var output = "";
			
			for (var i = 0; i < length; i++) {
				output += result.recordset[i].name;
				if (i < length - 1) {
					output += "\n";
				}
			}
			
			channel.send(output);
		});
	}
}