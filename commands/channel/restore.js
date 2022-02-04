const { Collection, MessageAttachment } = require('discord.js');

const db = require('better-sqlite3')('db/data.db', {readonly: true});

const channelQuery = db.prepare('SELECT Name FROM Channel WHERE ID = ? AND GuildID = ?');
const messageQuery = db.prepare(`
SELECT Message.ID, Message.Content, User.Username, User.AvatarURL FROM Message 
INNER JOIN Channel ON Message.ChannelID = Channel.ID 
INNER JOIN User ON Message.UserID = User.ID
WHERE Channel.ID = ? AND Channel.GuildID = ?
ORDER BY Message.CreatedAt`);

const embedQuery = db.prepare('SELECT Content FROM Embed WHERE MessageID = ?');
const attachmentQuery = db.prepare('SELECT Url, Name FROM Attachment WHERE MessageID = ?');

module.exports.execute = async function(interaction) {
	await interaction.deferReply();
	const channelId = interaction.options.getString("id");

	const channelData = channelQuery.get(channelId, interaction.guildId)

	if (interaction.guild.partial) {
		await interaction.guild.fetch();
	}
	const targetChannel = await interaction.guild.channels.create(channelData.Name);

	const messages = messageQuery.all(channelId, interaction.guildId);
	const webhooks = new Collection();
	const webhookCount = new Collection();
	for (const message of messages ){
		if (!webhooks.get(message.UserID)) {
			const webhook = await targetChannel.createWebhook(message.Username, {avatar: message.AvatarURL});
			webhooks.set(message.UserID, webhook);
		}
		const webhook = webhooks.get(message.UserID);
		let content = {content: message.Content, allowedMentions: {parse: ["everyone", "roles", "users"]}, embeds: [], attachments: []};
		const embeds = embedQuery.all(message.ID);
		for (const embed of embeds) {
			console.log(embed);
			content.embeds.push(JSON.parse(embed.Content));
		}

		const attachments = attachmentQuery.all(message.ID);
		console.log(attachments);
		for (const attachment of attachments) {
			content.attachments.push(new MessageAttachment(attachment.URL, attachment.Name));
		}

		await webhook.send(content);
		await new Promise(resolve => setTimeout(resolve, 2000)); //Synchronous sleep 2000ms
	};

	interaction.followUp("Done!");
}


module.exports.data = {
	name: 'restore',
	description: 'Restores specified channel to a previously saved state',
	options: [
		{
			type: 'STRING',
			name: 'id',
			description: 'Id of the channel to restore data from',
			required: true
		}
	]
}
