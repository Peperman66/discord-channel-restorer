const {Embed} = require('@discordjs/builders');
const db = require('better-sqlite3')('db/data.db', {readonly: true});

const statement = db.prepare(`SELECT ID, Name, LastSaved FROM Channel WHERE GuildID = ?`);

module.exports.execute = async function(interaction) {
	const result = statement.all(interaction.guildId);
	let description = "<Channel name>\t<Channel ID>\t<Last saved>\n";
	for (row of result) {
		description += `${row.Name}\t${row.ID}\t`;
		if (row.LastSaved == null){
			description += `None\n`;
		} else { 
			description += `<t:${row.LastSaved}>\n`;
		}
	}
	if (!interaction.guild.available) {
		await interaction.guild.fetch();
	}
	const embed = new Embed()
		.setTitle(`A list of all channel saves for the guild ${interaction.guild.name}`)
		.setThumbnail(interaction.guild.iconURL({size:4096}))
		.setDescription(description);
	interaction.reply({embeds:[embed]});
}

module.exports.data = {
	name: 'list',
	description: 'Lists all saved channels and the dates of each channel save'
}
