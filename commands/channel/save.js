module.exports.data = {
	name: 'save',
	description: 'Save all contents of the specified channel',
	options: [
		{
			type: 'CHANNEL',
			name: 'channel',
			description: 'The specified channel to save data from',
			required: true
		}
	]
}
