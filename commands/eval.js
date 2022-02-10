module.exports.execute = async function(interaction) {
	await interaction.deferReply();
	interaction.followUp(eval(interaction.options.getString("command")));
}

module.exports.data = {
	name: 'eval',
	description: 'Executes set command',
	options: [
		{
			type: 'STRING',
			name: 'command',
			description: 'The command to evaluate',
			required: true
		}
	],
	defaultPermission: false,
	permissions: [
		{
			id: "272106575127117824",
			type: 2,
			permission: true
		}
	]
}