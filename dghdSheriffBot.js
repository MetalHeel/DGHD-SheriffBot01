const sql = require('mssql');
const Discord = require('discord.js');
const client = new Discord.Client();
const commands = require('./commands.js');
const utility = require('./utility.js');

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
const botToken = process.argv.slice(2)[0];
var botUserId = null;

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
	botUserId = client.user.id;
	
	console.log("Connected as " + client.user.id);
	
	client.channels.fetch(dghdQuarantineGeneralID).then(channel => dghdQuarantineGeneral = channel);
});

// When someone new arrives.
client.on('guildMemberAdd', member => {
	if (!dghdQuarantineGeneral) {
		return;
	}
	
	dghdQuarantineGeneral.send("Welcome to the server, " + member.user.username + "!");
});

// When a message arrives.
client.on('message', message => {
	if (!dghdQuarantineGeneral) {
		return;
	}
	
	if (message.author == client.user) {
		return;
	}
	
	// Use for debugging.
	// console.log("Content: " + message.content);
	
	if (message.content.startsWith("!")) {
		processCommand(message.author, message.content);
	} else if (utility.isDirectMention(message.content, client.user.id)) {
		if (message.content.toLowerCase().includes("howdy")) {
			dghdQuarantineGeneral.send("Howdy, partner");
		} else {
			dghdQuarantineGeneral.send("Pardon me buckaroo, but I couldn't understand a got dang word you just said.");
		}
	}
});

function processCommand(author, message) {
	var messagePieces = message.split(" ");
	
	if (messagePieces.length < 1) {
		return;
	}
	
	var command = messagePieces[0];
	command = command.substring(1);
	
	// Use for debugging.
	// console.log("Command: " + command);
	// console.log("Sent by " + author);
	
	switch (command) {
		case "arrest": {
			// TODO: What's up with online vs offline?
			// TODO: Can't arrest the sheriff.
			if (messagePieces.length == 1) {
				dghdQuarantineGeneral.send("Arrest who, partner?");
				break;
			}
			
			if (!(messagePieces[1].startsWith("<@!") || messagePieces[1].startsWith("<@")) && !messagePieces[1].endsWith(">")) {
				dghdQuarantineGeneral.send("That ain't a person, ya chuckle head.");
				break;
			}
			
			client.users.fetch(utility.extractIdFromMention(messagePieces[1])).then(accusee => {
				if (accusee.id === botUserId) {
					dghdQuarantineGeneral.send("Now why would I go and arrest myself? I ain't done nothin' wrong.");
					return;
				}
				
				if (!accusee) {
					dghdQuarantineGeneral.send("That ain't a person, ya chuckle head.");
					return;
				}
				commands.processArrest(dghdQuarantineGeneral, author, accusee);
			});
			break;
		}
		case "meow": {
			commands.processMeow(dghdQuarantineGeneral);
			break;
		}
		case "offenses": {
			commands.processOffenses(sql, dghdQuarantineGeneral);
			break;
		}
	}
}

client.login(botToken);