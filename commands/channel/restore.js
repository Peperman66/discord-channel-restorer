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
