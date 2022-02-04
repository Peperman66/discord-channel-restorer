const db = require('better-sqlite3')('db/data.db');

const channelExistsQuery = db.prepare('SELECT * FROM Channel WHERE ID = ?');
const channelCreateQuery = db.prepare('INSERT INTO Channel (ID, GuildID, Name, LastSaved) VALUES (?, ?, ?, ?)');

const userExistQuery = db.prepare('SELECT * FROM User WHERE ID = ?');
const userCreateQuery = db.prepare('INSERT INTO User (ID, Username, AvatarURL) VALUES (?, ?, ?)');

const messageExistsQuery = db.prepare('SELECT * FROM Message WHERE ID = ?');
const messageUpdateQuery = db.prepare('UPDATE Message SET Content = ? WHERE ID = ?');
const messageCreateQuery = db.prepare('INSERT INTO Message (ID, ChannelID, UserID, CreatedAt, Content) VALUES (?, ?, ?, ?, ?)');

const embedDeleteQuery = db.prepare('DELETE FROM Embed WHERE MessageID = ?');
const embedCreateQuery = db.prepare('INSERT INTO Embed (MessageID, Content) VALUES (?, ?)');

const attachmentExistsQuery = db.prepare('SELECT * FROM Attachment WHERE ID = ? AND MessageID = ?');
const attachmentCreateQuery = db.prepare('INSERT INTO Attachment (ID, MessageID, Name, Url) VALUES (?, ?, ?, ?)');

const saveTransaction = db.transaction(async (messages) => {
	messages.forEach(async (message) => {
		if (message.partial) {
			await message.fetch();
		}
		if (channelExistsQuery.get(message.channel.id) == null) {
			if (message.channel.partial) {
				await message.channel.fetch();
			}
			channelCreateQuery.run(message.channelId, message.guildId, message.channel.name, null);
		}
		if (userExistQuery.get(message.author.id) == null) {
			if (message.member == null) {
				if (message.author.partial) {
					await message.author.fetch();
				}
				userCreateQuery.run(message.author.id, message.author.username, message.author.displayAvatarURL({size:4096}));
			} else {
				if (message.member.partial) {
					await message.member.fetch();
				}
				userCreateQuery.run(message.author.id, message.member.displayName, message.member.displayAvatarURL({size:4096}));
			}
		}
		if (messageExistsQuery.get(message.id) != null) {
			messageUpdateQuery.run(message.content, message.id);
			embedDeleteQuery.run(message.id);
		} else {
			messageCreateQuery.run(message.id, message.channelId, message.author.id, message.createdAt.getTime() / 1000, message.content);
		}
		if (message.embeds.length > 0) {
			for (const embed of message.embeds) {
				embedCreateQuery.run(message.id, JSON.stringify(embed.toJSON()));
			}
		}
		if (message.attachments.length > 0) {
			for (const attachment of message.attachments) {
				if (attachmentExistsQuery.get(attachment.id, message.id) != null) continue;
				attachmentCreateQuery.run(attachment.id, message.id, attachment.name, attachment.url);
			}
		}
	});
})

module.exports.save = async function(messages) {
	saveTransaction(messages)
}
