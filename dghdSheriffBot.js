/*
 * Major TODOS:
 *  - Error handling.
 *  - Guarantee the promises.
 *  - Figure out how to use mssql with objects instead of just strings.
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

// User for general channel.
const dghdQuarantineChannelID = "689656654329151613";
// Use for Sheriff's office.
//const dghdQuarantineChannelID = "690331814560268365";
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
	
	client.channels.fetch(dghdQuarantineChannelID).then(channel => Sheriff.theSheriff.channel = channel);
});

// When someone new arrives.
client.on('guildMemberAdd', member => {
	if (!Sheriff.theSheriff.channel) {
		return;
	}
	
	Sheriff.theSheriff.channel.send("Welcome to the server, " + member.user.username + "!");
});

// When a message arrives.
client.on('message', message => {
	if (!Sheriff.theSheriff.channel) {
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
	} else {
		// Reprimand this person if they're in jail and we hit the reprimand chance.
		var query = "SELECT jail.user_id, offenses.reprimand_chance FROM jail LEFT JOIN offenses ON jail.offense_name = offenses.name WHERE jail.user_id = " + message.author.id;
		var request = new sql.Request();
		request.query(query, function (err, result) {
			if (err) {
				console.log(err);
				return;
			}
			if (result.recordset.length == 0) {
				return;
			}
			if (result.recordset.length > 1) {
				console.log("We should not have multiple instances of a person in jail!");
				return;
			}
			var record = result.recordset[0];
			if (Math.floor(Math.random() * Math.floor(100)) <= record.reprimand_chance) {
				Sheriff.theSheriff.channel.send("Hey " + utility.encapsulateIdIntoMention(record.user_id) + ", pipe down in there!");
			}
		});
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
				Sheriff.theSheriff.channel.send("Arrest who, partner?");
				break;
			}
			if (!(messagePieces[1].startsWith("<@!") || messagePieces[1].startsWith("<@")) && !messagePieces[1].endsWith(">")) {
				Sheriff.theSheriff.channel.send("That ain't a person, ya chuckle head.");
				break;
			}
			client.users.fetch(utility.extractIdFromMention(messagePieces[1])).then(accusee => {
				commands.processArrest(author, accusee);
			});
			break;
		}
		case "currentsuspect": {
			commands.processCurrentSuspect();
			break;
		}
		case "meow": {
			commands.processMeow();
			break;
		}
		case "offenses": {
			commands.processOffenses();
			break;
		}
	}
}

function processDirectMention(content) {
	// TODO: Should it be exclusively howdy? Not just include?
	if (content.toLowerCase().includes("howdy")) {
		mentions.processHowdy();
		return;
	}
	if (content.toLowerCase().includes("thank you for your service")) {
		mentions.processThankYouForYourService();
		return;
	}
	if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect) {
		mentions.processPossibleAccusation(content);
		return;
	}
	Sheriff.theSheriff.channel.send("Pardon me buckaroo, but I couldn't understand a got dang word you just said.");
}

client.login(botToken);