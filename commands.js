const sql = require('mssql');
const utility = require('./utility.js');

var Sheriff = require("./theSheriff.js");

// TODO: Let's do a who's in jail
module.exports = {
	processArrest: function(accuser, accusee) {
		if (!accusee) {
			Sheriff.theSheriff.channel.send("That ain't a person, ya chuckle head.");
			return;
		}
		
		if (accusee.id === Sheriff.theSheriff.userId) {
			Sheriff.theSheriff.channel.send("Now why would I go and arrest myself? I ain't done nothin' wrong.");
			return;
		}
		
		if (accusee.id === accuser.id) {
			Sheriff.theSheriff.channel.send("You want to arrest yourself, partner? That's a bit asinine.");
			return;
		}
		
		if (accusee.id === Sheriff.theSheriff.currentSuspect) {
			Sheriff.theSheriff.channel.send("Listen, I'm already working on it. Quit buggin' me.");
			return;
		}
		
		if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect) {
			Sheriff.theSheriff.channel.send("I'm already working on a got dang case. Wait in line.");
			return;
		}
		
		Sheriff.theSheriff.currentAccuser = accuser.id;
		Sheriff.theSheriff.currentSuspect = accusee.id;
		
		Sheriff.theSheriff.channel.send("You want to put " + utility.encapsulateIdIntoMention(accusee) + " in jail? On what charges?");
	},
	
	processCurrentSuspect: function() {
		if (!Sheriff.theSheriff.currentAccuser && !Sheriff.theSheriff.currentSuspect) {
			Sheriff.theSheriff.channel.send("All's quiet on the prairie. No crimes here.");
			return;
		}
		
		Sheriff.theSheriff.channel.send(utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentAccuser) + " seems to think " +
			utility.encapsulateIdIntoMention(Sheriff.theSheriff.currentSuspect) + " has committed a crime.");
	},
	
	processMeow: function() {
		Sheriff.theSheriff.channel.send("I ain't no got dang cat.");
	},
	
	processOffenses: function() {
		var request = new sql.Request();
		request.query("SELECT name FROM offenses", function (err, result) {
			if (err) {
				console.log(err);
				Sheriff.theSheriff.currentAccuser = null;
				Sheriff.theSheriff.currentSuspect = null;
				return;
			}
			
			var length = Object.keys(result.recordset).length;
			var output = "";
			
			for (var i = 0; i < length; i++) {
				output += result.recordset[i].name;
				if (i < length - 1) {
					output += "\n";
				}
			}
			
			Sheriff.theSheriff.channel.send(output);
		});
	}
}