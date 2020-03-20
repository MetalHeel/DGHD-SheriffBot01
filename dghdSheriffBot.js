/*
 * Major TODOS:
 *  - Error handling.
 *  - Guarantee the promises.
 */

const sql = require('mssql');
const Discord = require('discord.js');
const client = new Discord.Client();
const commands = require('./commands.js');
const mentions = require('./directMentions.js');
const utility = require('./utility.js');

require("./timedEvents.js");

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

var Sheriff = require("./theSheriff.js");

// The bot token must be passed in, we can't have it public anywhere.
const botToken = process.argv.slice(2)[0];

//const dghdQuarantineGeneralID = "689656654329151613";
// Use for Sheriff's office.
const dghdQuarantineGeneralID = "690331814560268365";
var dghdQuarantineGeneral = null;

sql.connect(config, function (err) {
	if (err) {
		console.log(err);
	} else {
		console.log("Established connection with database.");
	}
});

client.on('ready', () => {
	Sheriff.theSheriff.userId = client.user.id;
	
	console.log("Connected as " + client.user.id);

	// Use to output channels.
	/*client.channels.cache.forEach(channel => {
		console.log(channel.name + " " + channel.id);
	});*/
	
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
		processDirectMention(message.content);
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
	
	switch (command.toLowerCase()) {
		case "arrest": {
			// TODO: What's up with online vs offline?
			if (messagePieces.length == 1) {
				dghdQuarantineGeneral.send("Arrest who, partner?");
				break;
			}
			if (!(messagePieces[1].startsWith("<@!") || messagePieces[1].startsWith("<@")) && !messagePieces[1].endsWith(">")) {
				dghdQuarantineGeneral.send("That ain't a person, ya chuckle head.");
				break;
			}
			// TODO: Do you want to use await here?
			client.users.fetch(utility.extractIdFromMention(messagePieces[1])).then(accusee => {
				commands.processArrest(dghdQuarantineGeneral, author, accusee);
			});
			break;
		}
		case "currentsuspect": {
			commands.processCurrentSuspect(dghdQuarantineGeneral);
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

function processDirectMention(content) {
	// TODO: Should it be exclusively howdy? Not just include?
	if (content.toLowerCase().includes("howdy")) {
		mentions.processHowdy(dghdQuarantineGeneral);
		return;
	}
	if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect) {
		mentions.processPossibleAccusation(sql, dghdQuarantineGeneral, content);
		return;
	}
	dghdQuarantineGeneral.send("Pardon me buckaroo, but I couldn't understand a got dang word you just said.");
}

client.login(botToken);