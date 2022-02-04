const { Collection, MessageAttachment } = require('discord.js');

const db = require('better-sqlite3')('db/data.db', {readonly: true});

const channelQuery = db.prepare('SELECT Name, Topic FROM Channel WHERE ID = ? AND GuildID = ?');
const messageQuery = db.prepare(`
SELECT Message.ID, Message.UserID, Message.Pinned, Message.Content, User.Username, User.AvatarURL FROM Message 
INNER JOIN Channel ON Message.ChannelID = Channel.ID 
INNER JOIN User ON Message.UserID = User.ID
WHERE Channel.ID = ? AND Channel.GuildID = ?
ORDER BY Message.CreatedAt`);

const embedQuery = db.prepare('SELECT Content FROM Embed WHERE MessageID = ?');
const attachmentQuery = db.prepare('SELECT ID, Name, Url FROM Attachment WHERE MessageID = ?');

module.exports.execute = async function(interaction) {
	await interaction.deferReply();
	const channelId = interaction.options.getString("id");

	const channelData = channelQuery.get(channelId, interaction.guildId)

	if (interaction.guild.partial) {
		await interaction.guild.fetch();
	}
	const targetChannel = await interaction.guild.channels.create(channelData.Name, {topic: channelData.Topic});

	const messages = messageQuery.all(channelId, interaction.guildId);
	const estimatedEnd = Date.now() + messages.length * 2000; //Every message takes two seconds to send
	interaction.followUp(`Estimated time of completion: <t:${Math.ceil(estimatedEnd/1000)}:R>`);
	const webhooks = new Collection();
	for (const message of messages ){
		if (!webhooks.get(message.UserID)) {
			const webhook = await targetChannel.createWebhook(message.Username, {avatar: message.AvatarURL});
			webhooks.set(message.UserID, webhook);
		}
		const webhook = webhooks.get(message.UserID);
		let content = {content: message.Content, allowedMentions: {parse: ["everyone", "roles", "users"]}, embeds: [], files: []};
		const embeds = embedQuery.all(message.ID);
		for (const embed of embeds) {
			console.log(embed);
			content.embeds.push(JSON.parse(embed.Content));
		}

		const attachments = attachmentQuery.all(message.ID);
		for (const attachment of attachments) {
			content.files.push({attachment: attachment.Url, name: attachment.Name});
		}

		if (content.content == "" && content.embeds.length == 0 && content.files.length == 0) content.content = "​";

		const newMessage = await webhook.send(content);
		console.log(message.Pinned);
		if (message.Pinned == 1) {
			newMessage.pin();
		}
		await new Promise(resolve => setTimeout(resolve, 2000)); //Synchronous sleep 2000ms
	};

	interaction.followUp("Done!")
	.catch(() => {
		interaction.channel.send("Done!");
	})
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
