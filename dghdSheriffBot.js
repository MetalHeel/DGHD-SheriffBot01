const Discord = require('discord.js');
const client = new Discord.Client();

// The bot token must be passed in, we can't have it public anywhere.
const args = process.argv.slice(2)
const botToken = args[0]

const dghdQuarantineGeneralID = "689656654329151613";
dghdQuarantineGeneral = null;

client.on('ready', () => {
    console.log("Connected as " + client.user.id);
	
	client.channels.fetch(dghdQuarantineGeneralID).then(channel => dghdQuarantineGeneral = channel);
});

client.on('message', message => {
	if (!dghdQuarantineGeneral) {
		return;
	}
	
	if (message.author == client.user) {
        return;
    }
	
	// Use for debugging.
	// console.log("Content: " + message.content);
	
    if ((message.content.startsWith("<@!" + client.user.id + ">") || message.content.startsWith("<@" + client.user.id + ">")) && message.content.toLowerCase().includes("howdy")) {
        dghdQuarantineGeneral.send("Howdy, partner");
    }
});

client.login(botToken);