const db = require('better-sqlite3')('db/data.db');
const messageSave = require('../../handlers/messageSave.js');
const {ChannelType} = require('discord-api-types/v9');
const { Collection } = require('discord.js');

const channelSaveExistsQuery = db.prepare('SELECT * FROM Channel WHERE ID = ?');
const channelSaveCreateQuery = db.prepare('INSERT INTO Channel (ID, GuildID, Name, LastSaved) VALUES (?, ?, ?, ?)');
const channelSaveUpdateQuery = db.prepare('UPDATE Channel SET LastSaved = ? WHERE ID = ?');

async function getAllMessagesInChannel(channel) {
	let last = undefined;
	let messages = new Collection();
	do {
		var currentMessages = await channel.messages.fetch({before: last?.id});
		last = currentMessages?.last();
		messages = messages.concat(currentMessages);
		console.log(currentMessages.size);
	} while (currentMessages.size > 0); 
	return messages;
}

module.exports.execute = async function(interaction) {
	interaction.deferReply();
	const targetChannel = interaction.options.get("channel").channel;
	if (targetChannel.partial) {
		await targetChannel.fetch();
	}
	const messages = await getAllMessagesInChannel(targetChannel);
	messageSave.save(messages);
	
	if (channelSaveExistsQuery.get(targetChannel.id) != null) {
		channelSaveUpdateQuery.run(Date.now() / 1000, targetChannel.id);
	} else {
		channelSaveCreateQuery.run(targetChannel.id, targetChannel.guild.id, targetChannel.name, Date.now() / 1000);
	}

	interaction.followUp("Done!");
}

module.exports.data = {
	name: 'save',
	description: 'Save all contents of the specified channel',
	options: [
		{
			type: 'CHANNEL',
			name: 'channel',
			description: 'The specified channel to save data from',
			channelTypes: [ChannelType.GuildText],
			required: true
		}
	]
}
