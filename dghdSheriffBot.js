/*
 * Major TODOS:
 *  - Error handling.
 *  - Guarantee the promises.
 *  - Figure out how to use mssql with objects instead of just strings.
 *  - Make this data driven (responses in the database, etc.).
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
	Sheriff.theSheriff.lastCheckAroundTheBeat = new Date().getTime();
	Sheriff.theSheriff.timeUntilNextBeatCheck = utility.getRandomNumberBetweenXAndY(Sheriff.theSheriff.timeUntilNextBeatCheckLowerLimit, Sheriff.theSheriff.timeUntilNextBeatCheckHigherLimit);
	
	// Use to output channels.
	/*client.channels.cache.forEach(channel => {
		console.log(channel.name + " " + channel.id);
	});*/
	
	client.channels.fetch(dghdQuarantineChannelID).then(channel => Sheriff.theSheriff.channel = channel);
	
	console.log("Connected as " + client.user.id);
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
	
	if (message.channel != Sheriff.theSheriff.channel) {
		return;
	}
	
	if (message.author == client.user) {
		return;
	}
	
	// Use for debugging.
	// console.log("Content: " + message.content);
	
	Sheriff.theSheriff.lastChatTime = new Date().getTime();
	
	if (message.content.startsWith("!")) {
		processCommand(message.author, message.content);
	} else if (utility.isDirectMention(message.content, client.user.id)) {
		processDirectMention(message.content, message.author.id);
	} else {
		// Reprimand this person if they're in jail and we hit the reprimand chance.
		if (message.author.id in Sheriff.theSheriff.jail) {
			var request = new sql.Request();
			request.query("SELECT reprimand_chance FROM offense WHERE name = '" + Sheriff.theSheriff.jail[message.author.id].offense + "'", function (err, result) {
				if (err) {
					console.log(err);
					return;
				}
				if (utility.getRandomNumberBetweenXAndY(1, 100) <= result.recordset[0].reprimand_chance) {
					Sheriff.theSheriff.channel.send("Hey " + utility.encapsulateIdIntoMention(message.author.id) + ", pipe down in there!");
				}				
			});
		}
	}
});

function processCommand(author, message) {
	var messagePieces = message.split(" ");
	
	if (messagePieces.length < 1) {
		return;
	}
	
	var command = null;
	var possibleCommand = messagePieces[0];
	possibleCommand = possibleCommand.substring(1);
	
	// Use for debugging.
	// console.log("Command: " + possibleCommand);
	// console.log("Sent by " + author);
	
	// Special case for dynamic dice rolling.
	if (possibleCommand.startsWith("roll")) {
		command = possibleCommand.substring(0, 5);
	} else {
		command = possibleCommand;
	}
	
	if (!command) {
		return;
	}
	
	switch (command.toLowerCase()) {
		case commands.ARREST: {
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
		case commands.COMMANDS: {
			commands.processCommands();
			break;
		}
		case commands.CURRENT_SUSPECT: {
			commands.processCurrentSuspect();
			break;
		}
		case commands.MEOW: {
			commands.processMeow();
			break;
		}
		case commands.OFFENSES: {
			commands.processOffenses();
			break;
		}
		case commands.ROLL_D: {
			commands.processRollDX(possibleCommand.substring(5));
			break;
		}
		case commands.WHOS_IN_JAIL: {
			commands.processWhosInJail();
			break;
		}
	}
}

function processDirectMention(content, authorId) {
	// TODO: Have him wait briefly on a followup
	if (content === utility.encapsulateIdIntoMention(client.user.id) || content === utility.encapsulateIdIntoMention(client.user.id, true)) {
		Sheriff.theSheriff.channel.send("Yes?");
		return;
	}
	// TODO: Should it be exclusively howdy? Not just include?
	if (content.toLowerCase().includes("howdy")) {
		mentions.processHowdy();
		return;
	}
	if (content.toLowerCase().includes("thank you for your service")) {
		mentions.processThankYouForYourService();
		return;
	}
	if (content.toLowerCase().includes("can i have a beer please")) {
		mentions.processCanIHaveABeerPlease();
		return;
	}
	if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect) {
		if (authorId !== Sheriff.theSheriff.currentAccuser) {
			Sheriff.theSheriff.channel.send("Sorry partner, only the original accuser can press charges.");
			return;
		}
		mentions.processPossibleAccusation(content);
		return;
	}
	Sheriff.theSheriff.channel.send("Pardon me buckaroo, but I couldn't understand a got dang word you just said.");
}

client.login(botToken);