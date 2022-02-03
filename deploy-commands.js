require('dotenv').config();
const {SlashCommandBuilder} = require('@discordjs/builders');
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const fs = require('fs');

function createCommandFromData(command, data) {
	command.setName(data.name).setDescription(data.description);
	if (data.options != null) {
		data.options.forEach(option => {
			switch(option.type) {
				case 'CHANNEL':
					command.addChannelOption(commandOption => createCommandOptionFromData(commandOption, data));
					break;
				case 'STRING':
					command.addStringOption(commandOtion => createCommandOptionFromData(commandOption, data));
			}
		})
	}
	return command;
}

function createCommandOptionFromData(option, data) {
	option.setName(data.name).setDescription(data.description);
	if (data.required != null) {
		option.setRequired(data.required);
	}
}

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('js'));

for (const file of commandFiles) {
	const commandData = require(`./commands/${file}`).data;
	const command = createCommandFromData(new SlashCommandBuilder(), commandData);
	if (commandData.subcommandFiles != null) {
		commandData.subcommandFiles.forEach(subcommandFile => {
			const subcommandData = require(`./commands/${subcommandFile}`);
			command.addSubcommand(subcommand => {
				createCommandFromData(subcommand, subcommandData);
			});
		});
	}
	commands.push(command.toJSON());
}

const rest = new REST({version: '9'}).setToken(process.env.TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.MAIN_GUILD_ID), {body: commands})
	.then(() => console.log('Succesfully registered application commands.'))
	.catch(console.error);
