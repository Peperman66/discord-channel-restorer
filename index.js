require("dotenv").config();
const Discord = require("discord.js");
const fs = require('fs');
require('./create-db.js').run();
const messageSave = require('./handlers/messageSave.js');

const client = new Discord.Client({
	presence: {
		activities: [{name: 'those messages', type: "WATCHING"}]
	},
	intents: [Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILDS]
});

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith(".js"));
for (file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}


client.on('ready', () => {
	console.log("Bot is ready!");
});

client.on('messageCreate', message => {
	messageSave.save(new Discord.Collection([[message.id, message]]));
});

client.on('messageUpdate', (oldMsg, newMsg) => {
	messageSave.save(new Discord.Collection([[newMsg.id, newMsg]]));
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	console.log(interaction);

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		const message = {content: "There was an error while executing this command!", ephemeral: true}
		if (interaction.deferred) {
			await interaction.followUp(message); 
		} else {
			await interaction.reply(message);
		}
	}
});

client.login(process.env.TOKEN);
