const fs = require('fs');
const Discord = require('discord.js');

const subcommands = new Discord.Collection();
const subcommandFiles = fs.readdirSync('./commands/channel/').filter(file => file.endsWith('js'));
for (file of subcommandFiles) {
	const subcommand = require(`./channel/${file}`);
	subcommands.set(subcommand.data.name, subcommand);
}

module.exports.execute = async function(interaction) {
	const subcommand = subcommands.get(interaction.options.getSubcommand());
	if (!subcommand) return;

	await subcommand.execute(interaction);

}

module.exports.data = {
	name: 'channel',
	description: 'Manage saving and restoring channels',
	subcommandFiles: ['channel/list.js', 'channel/restore.js', 'channel/save.js', 'channel/delete.js']
};
