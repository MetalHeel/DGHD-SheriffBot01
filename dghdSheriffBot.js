/*
 * Major TODOS:
 *  - Error handling.
 *  - Guarantee the promises.
 *  - Figure out how to use mssql with objects instead of just strings.
 *  - Need some sort of debug command so I can simulate guild adds and such.
 */

const sql = require('mssql');
const { Client, EmbedBuilder, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({ intents: [
	GatewayIntentBits.DirectMessageReactions,
	GatewayIntentBits.DirectMessageTyping,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildBans,
	GatewayIntentBits.GuildEmojisAndStickers,
	GatewayIntentBits.GuildIntegrations,
	GatewayIntentBits.GuildInvites,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessageReactions,
	GatewayIntentBits.GuildMessageTyping,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.GuildScheduledEvents,
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildWebhooks,
	GatewayIntentBits.MessageContent
] });
const commands = require('./commands.js');
const messageVariationTypes = require('./messageVariationTypes.js');
const messaging = require('./messaging.js');
const utility = require('./utility.js');

require("./timedEvents.js");

// SQL configuration.
var config = {
	user: 'sa',
	password: 'password',
	server: 'localhost', 
	database: 'DGHD-Sheriff',
	trustServerCertificate: true,
	options: {
		enableArithAbort: true
	}
};

var Sheriff = require("./theSheriff.js");

// The bot token must be passed in, we can't have it public anywhere.
const botToken = process.argv.slice(2)[0];

// User for general channel.
const dghdQuarantineChannelID = "689656654329151613";
const pinboardChannelID = "797202566555107378";
const laboratoryChannelID = "824393931176804373";

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
	
	var channelIdToUse = dghdQuarantineChannelID;
	// Use for connecting to the laboratory channel.
	//var channelIdToUse = laboratoryChannelID;
	
	client.channels.fetch(channelIdToUse).then(channel => Sheriff.theSheriff.channel = channel);
	console.log("Connected as " + client.user.id);
});

// When someone new arrives.
client.on('guildMemberAdd', member => {
	if (!Sheriff.theSheriff.channel) {
		return;
	}
	var replacements = {};
	replacements[messaging.USERNAME_TOKEN] = utility.encapsulateIdIntoMention(member.user.id);
	messaging.sendResponseWithReplacements(messageVariationTypes.WELCOME, replacements);
});

// When a message arrives.
client.on('messageCreate', message => {
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
	//console.log("Admin: " + message.member.permissions.has(PermissionsBitField.Flags.Administrator));
	
	Sheriff.theSheriff.lastChatTime = new Date().getTime();
	if (message.content.startsWith("!")) {
		processCommand(message.author, message.content, message.member.permissions.has(PermissionsBitField.Flags.Administrator));
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
					var replacements = {};
					replacements[messaging.STANDARD_USER_MENTION_TOKEN] = utility.encapsulateIdIntoMention(message.author.id);
					messaging.sendResponseWithReplacements(messageVariationTypes.REPRIMAND, replacements);
				}
			});
		}
	}
});

// Raw event catcher. For now just used for pins.
client.on('raw', packet => {
	if (packet.t !== "MESSAGE_REACTION_ADD") {
		return;
	}
	if (packet.d.emoji.name !== "pin") {
		return;
	}
	if (packet.d.emoji.id !== "824431020476334120") {
		return;
	}
	client.channels.fetch(packet.d.channel_id).then(channel => {
		channel.messages.fetch(packet.d.message_id).then(message => {
			if (message.author.id === Sheriff.theSheriff.userId) {
				return;
			}
			client.users.fetch(message.author.id).then(user => {
				client.channels.fetch(pinboardChannelID).then(pinboardChannel => {
					pinboardChannel.messages.fetch().then(messages => {
						var newDescription = message.content + "\n\n[Jump to Message](" + message.url + ")";
						for (var entry of messages.entries()) {
							var messageEmbed = entry[1].embeds[0];
							if (!messageEmbed) {
								continue;
							}
							if (!messageEmbed.author) {
								continue;
							}
							if (messageEmbed.description.includes(message.url)) {
								return;
							}
						}
						client.users.fetch(packet.d.user_id).then(pinner => {
							var embed = new EmbedBuilder();
							embed.setAuthor({ name: user.username, iconURL: user.avatarURL() });
							embed.setDescription(newDescription);
							var newFiles = [];
							if (message.attachments && message.attachments.size > 0) {
								for (var entry of message.attachments.entries()) {
									var attachment = entry[1];
									newFiles.push(attachment.url);
								}
							}
							pinboardChannel.send({ embeds: [embed], files: newFiles });
							var notificationEmbed = new EmbedBuilder();
							notificationEmbed.setColor("#C27C0E");
							notificationEmbed.setDescription(utility.encapsulateIdIntoMention(pinner.id, true) + " done pinned [a dang ole message](" +
								message.url + ") from this channel. See all pins in " + utility.encapsulateIdIntoChannelMention(pinboardChannelID) + ".");
							channel.send({ embeds: [notificationEmbed] });
						});
					});
				});
			});
		});
	});
});

function processCommand(author, message, isAdmin) {
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
				messaging.sendResponse(messageVariationTypes.ARREST_WHO);
				break;
			}
			if (!(messagePieces[1].startsWith("<@!") || messagePieces[1].startsWith("<@")) && !messagePieces[1].endsWith(">")) {
				messaging.sendResponse(messageVariationTypes.NOT_A_PERSON);
				break;
			}
			client.users.fetch(utility.extractIdFromMention(messagePieces[1])).then(accusee => {
				commands.processArrest(author, accusee);
			}).catch(function(error) {
				if (error.message === "Unknown User") {
					messaging.sendResponse(messageVariationTypes.NOT_A_PERSON);
				} else {
					console.error(error);
				}
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
		case commands.TOGGLE_PATROL: {
			if (!isAdmin) {
				break;
			}
			commands.processTogglePatrol();
			break;
		}
		case commands.WHOS_IN_JAIL: {
			commands.processWhosInJail();
			break;
		}
	}
}

function processDirectMention(content, authorId) {
	// TODO: Have him wait briefly on a followup.
	if (content === utility.encapsulateIdIntoMention(client.user.id) || content === utility.encapsulateIdIntoMention(client.user.id, true)) {
		Sheriff.theSheriff.channel.send("Yessum?");
		return;
	}
	var mentionText = content.substring(content.indexOf(" ") + 1).toLowerCase().replace(/'/g, "''");
	var request = new sql.Request();
	request.query("SELECT response FROM mention_response WHERE mention_text LIKE '%" + mentionText + "%'", function (err, result) {
		if (err) {
			console.log(err);
			return;
		}
		if (Object.keys(result.recordset).length == 0) {
			if (Sheriff.theSheriff.currentAccuser && Sheriff.theSheriff.currentSuspect) {
				if (authorId !== Sheriff.theSheriff.currentAccuser) {
					messaging.sendResponse(messageVariationTypes.ORIGINAL_ACCUSER);
					return;
				}
				messaging.processPossibleAccusation(content);
			} else {
				messaging.sendResponse(messageVariationTypes.COULD_NOT_UNDERSTAND);
			}
		} else {
			var choice = utility.getRandomNumberBetweenXAndY(0, Object.keys(result.recordset).length - 1);
			Sheriff.theSheriff.channel.send(result.recordset[choice].response);
		}
	});
}

client.login(botToken);