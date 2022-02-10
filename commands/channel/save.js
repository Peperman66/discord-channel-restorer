const db = require('better-sqlite3')('db/data.db', {fileMustExist: true});
const messageSave = require('../../handlers/messageSave.js');
const {ChannelType} = require('discord-api-types/v9');
const { Collection } = require('discord.js');

const channelSaveExistsQuery = db.prepare('SELECT * FROM Channel WHERE ID = ?');
const channelSaveCreateQuery = db.prepare('INSERT INTO Channel (ID, GuildID, Name, Topic, LastSaved) VALUES (?, ?, ?, ?, ?)');
const channelSaveUpdateQuery = db.prepare('UPDATE Channel SET LastSaved = ? WHERE ID = ?');

async function getAllMessagesInChannel(channel, callback) {
	let last = undefined;
	let messages = new Collection();
	let interval = setInterval(() => callback(messages.size), 5000);
	do {
		var currentMessages = await channel.messages.fetch({before: last?.id});
		last = currentMessages?.last();
		messages = messages.concat(currentMessages);
		console.log(messages.size);
	} while (currentMessages.size > 0);
	clearInterval(interval); 
	return messages;
}

module.exports.execute = async function(interaction) {
	let reply = await interaction.deferReply();
	const targetChannel = interaction.options.getChannel("channel");
	if (targetChannel.partial) {
		await targetChannel.fetch();
	}
	const messages = await getAllMessagesInChannel(targetChannel, (messageCount) => {interaction.editReply(`Found ${messageCount} messages so far!`)});
	interaction.editReply(`Saving ${messages.size} messages!`);
	messageSave.save(messages)
		.then(() => {
			if (channelSaveExistsQuery.get(targetChannel.id) != null) {
				channelSaveUpdateQuery.run(Math.floor(Date.now() / 1000), targetChannel.id);
			} else {
				channelSaveCreateQuery.run(targetChannel.id, targetChannel.guild.id, targetChannel.name, targetChannel.topic, Date.now() / 1000);
			}

			interaction.followUp("Done!");
		})
		.catch((e) => {
			interaction.followUp("Error!");
			console.error(e);
		})	
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
