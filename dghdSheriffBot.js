const Discord = require('discord.js');
const client = new Discord.Client();

const botToken = "Njg5ODczNjQyMzY4MDA4Mjg3.XnJPbQ.-0BZElej7k_QOTyS3IDix9zMYyk";
const dghdQuarantineGeneralID = "689656654329151613";

client.on('ready', () => {
    console.log("Connected as " + client.user.tag);
	
	client.channels.fetch(dghdQuarantineGeneral).then(channel => channel.send("Hello World!"));
});

client.login(botToken);