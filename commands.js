const utility = require('./utility.js');

module.exports = {
	processArrest: function(channel, accuser, accusee) {
		if (accusee.id === accuser.id) {
			channel.send("You want to arrest yourself, partner? That's a bit asinine.");
			return;
		}
		
		channel.send("I see you want to put " + utility.encapsulateIdIntoMention(accusee) + " in jail. Not quite ready for that yet partner, but I will be soon.");
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