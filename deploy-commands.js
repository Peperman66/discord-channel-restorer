require('dotenv').config();
const {SlashCommandBuilder} = require('@discordjs/builders');
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const { Collection } = require('discord.js');
const fs = require('fs');

const permissions = new Collection();

function createCommandFromData(command, data) {
	command.setName(data.name).setDescription(data.description);
	if (data.options != null) {
		data.options.forEach(option => {
			switch(option.type) {
				case 'CHANNEL':
					command.addChannelOption(commandOption => createCommandOptionFromData(commandOption, option));
					break;
				case 'STRING':
					command.addStringOption(commandOption => createCommandOptionFromData(commandOption, option));
			}
		})
	}
	if (data.defaultPermission != null) {
		command.setDefaultPermission(data.defaultPermission);
	}
	if (data.permissions != null) {
		permissions.set(data.name, data.permissions);
	}
	return command;
}

function createCommandOptionFromData(option, data) {
	option.setName(data.name).setDescription(data.description);
	if (data.required != null) {
		option.setRequired(data.required);
	}
	if (data.channelTypes != null) {
		option.addChannelTypes(data.channelTypes)
	}
	return option;
}

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('js'));

for (const file of commandFiles) {
	const commandData = require(`./commands/${file}`).data;
	const command = createCommandFromData(new SlashCommandBuilder(), commandData);
	if (commandData.subcommandFiles != null) {
		commandData.subcommandFiles.forEach(subcommandFile => {
			const subcommandData = require(`./commands/${subcommandFile}`).data;
			command.addSubcommand(subcommand => {
				return createCommandFromData(subcommand, subcommandData);
			});
		});
	}
	commands.push(command.toJSON());
}

const rest = new REST({version: '9'}).setToken(process.env.TOKEN);

rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {body: commands})
	.then(data => {
		console.log(data);
		const targetPermissionData = [];
		for (const command of data) {
			if (permissions.get(command.name) != null) {
				targetPermissionData.push({
					id: command.id,
					permissions: permissions.get(command.name)
				});
			}
		}
		rest.put(Routes.guildApplicationCommandsPermissions(process.env.CLIENT_ID, process.env.MAIN_GUILD_ID), {body: targetPermissionData});
	})
	.then(() => console.log('Succesfully registered application commands.'))
	.catch(console.error);




rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.MAIN_GUILD_ID), {body: [] /*commands*/});