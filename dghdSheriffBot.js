const sql = require('mssql');
const Discord = require('discord.js');
const client = new Discord.Client();

// SQL configuration.
var config = {
	user: 'sa',
	password: 'password',
	server: 'localhost', 
	database: 'DGHD-Sheriff',
	options: {
		enableArithAbort: true
	}
};

// The bot token must be passed in, we can't have it public anywhere.
const args = process.argv.slice(2)
const botToken = args[0]

const dghdQuarantineGeneralID = "689656654329151613";
var dghdQuarantineGeneral = null;

sql.connect(config, function (err) {
	if (err) {
		console.log(err);
	} else {
		console.log("Established connection with database.");
	}
});

client.on('ready', () => {
    console.log("Connected as " + client.user.id);
	
	client.channels.fetch(dghdQuarantineGeneralID).then(channel => dghdQuarantineGeneral = channel);
});

// When someone new arrives.
client.on('guildMemberAdd', member => {
	if (!dghdQuarantineGeneral) {
		return;
	}
	
	dghdQuarantineGeneral.send("Welcome to the server, " + member + "!");
});

// When when a message arrives.
client.on('message', message => {
	if (!dghdQuarantineGeneral) {
		return;
	}
	
	if (message.author == client.user) {
        return;
    }
	
	// Use for debugging.
	// console.log("Content: " + message.content);
	
    if (isMention(message.content, client.user.id)) {
		if (message.content.toLowerCase().includes("howdy")) {
			dghdQuarantineGeneral.send("Howdy, partner");
		} else {
			dghdQuarantineGeneral.send("Pardon me buckaroo, but I couldn't understand a got dang word you just said.");
		}
    }
	
	if (message.content === "!offenses") {
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
            dghdQuarantineGeneral.send(output);
        });
	}
});

function processCommand(command) {
	switch (command) {
		case "offenses": {
			break;
		}
		case "arrest": {
			break;
		}
	}
}

function isMention(content, userId) {
	return (content.startsWith("<@!" + client.user.id + ">") || content.startsWith("<@" + client.user.id + ">"));
}

client.login(botToken);