const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

module.exports = {
	processArrest: function(channel, accuser, accusee) {
		if (accusee.id === Sheriff.theSheriff.currentSuspect) {
			channel.send("Listen, I'm already working on it. Quit buggin' me.");
			return;
		}
		
		if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect) {
			channel.send("I'm already working on a got dang case. Wait in line.");
			return;
		}
		
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
	
	processCurrentSuspect: function(channel) {
		if (!Sheriff.theSheriff.currentAccuser && !Sheriff.theSheriff.currentSuspect) {
			channel.send("All's quiet on the prairie. No crimes here.");
			return;
		}
		
		channel.send(utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentAccuser) + " seems to think " +
			utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + " has committed a crime.");
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