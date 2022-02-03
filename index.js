require("dotenv").config();
const Discord = require("discord.js");
const fs = require('fs');
require('./create-db.js').run();

const client = new Discord.Client({
	presence: {
		activities: [{name: 'those messages', type: "WATCHING"}]
	},
	intents: Discord.Intents.FLAGS.GUILD_MESSAGES
});

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith(".js"));
for (file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}


client.on('ready', () => {
	console.log("Bot is ready!");
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
		await interaction.reply({content: "There was an error while executing this command!", ephemeral: true})
	}
});

client.login(process.env.TOKEN);
