const db = require('better-sqlite3')('db/data.db', {fileMustExist: true});

const channelExistsQuery = db.prepare(`SELECT ID FROM Channel WHERE GuildID = ? AND ID = ?`);

const deleteEmbedsQuery = db.prepare(`DELETE FROM Embed WHERE MessageID IN (
	SELECT ID FROM Message WHERE ChannelID = ?
)`);
const deleteAttachmentsQuery = db.prepare(`DELETE FROM Attachment WHERE MessageID IN (
	SELECT ID FROM Message WHERE ChannelID = ?
)`);
const deleteMessageQuery = db.prepare(`DELETE FROM Message WHERE ChannelID = ?`);
const deleteChannelSaveQuery = db.prepare(`DELETE FROM Channel WHERE ID = ?`);

const deleteTransaction = db.transaction((queries, channelId) => {
	for (query of queries) {
		query.run(channelId);
	}
});

module.exports.execute = function(interaction) {
	const targetChannelId = interaction.options.getString("id");
	if (channelExistsQuery.get(interaction.guildId, targetChannelId) == null) return interaction.reply("No specified channel found!");
	deleteTransaction([deleteEmbedsQuery, deleteAttachmentsQuery, deleteMessageQuery, deleteChannelSaveQuery], targetChannelId);
	interaction.reply("Done!");
}

module.exports.data = {
	name: 'delete',
	description: 'Deletes specified channel save',
	options: [
		{
			type: 'STRING',
			name: 'id',
			description: 'Id of the channel to delete save data from',
			required: true
		}
	]
}
