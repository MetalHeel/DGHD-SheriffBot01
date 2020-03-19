const sql = require('mssql');
const Discord = require('discord.js');
const client = new Discord.Client();
const commands = require('./commands.js');

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
const botToken = process.argv.slice(2)[0]

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
		processCommand(message.content.substring(1));
	} else if (isMention(message.content, client.user.id)) {
		if (message.content.toLowerCase().includes("howdy")) {
			dghdQuarantineGeneral.send("Howdy, partner");
		} else {
			dghdQuarantineGeneral.send("Pardon me buckaroo, but I couldn't understand a got dang word you just said.");
		}
	}
});

function processCommand(command) {
	switch (command) {
		case "arrest": {
			commands.processArrest();
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

function isMention(content, userId) {
	return content.startsWith("<@!" + userId + ">") || content.startsWith("<@" + userId + ">");
}

client.login(botToken);