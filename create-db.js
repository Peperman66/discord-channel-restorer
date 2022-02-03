const db = require('better-sqlite3')('db/data.db')

tables = [
	`CREATE TABLE IF NOT EXISTS Channel (
		ID VARCHAR(20) PRIMARY KEY,
		GuildID VARCHAR(20) NOT NULL,
		LastSaved TIMESTAMP
	)`,
	`CREATE TABLE IF NOT EXISTS User (
		ID VARCHAR(20) PRIMARY KEY,
		Username VARCHAR(32) NOT NULL,
		AvatarUrl TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS Message (
		ID VARCHAR(20) PRIMARY KEY,
		ChannelID VARCHAR(20) REFERENCES Channel(ID),
		Author VARCHAR(20) REFERENCES User(ID),
		Content TEXT
	)`,
	`CREATE TABLE IF NOT EXISTS Embed (
		ID INTEGER PRIMARY KEY,
		MessageID VARCHAR(20) REFERENCES Message(ID),
		Content TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS Attachment (
		ID VARCHAR(20) PRIMARY KEY,
		MessageID VARCHAR(20) REFERENCES Message(ID),
		Filename TEXT NOT NULL,
		Url TEXT NOT NULL
	)`
]

module.exports.run = () => db.transaction((tables) => {
	for (const table of tables) db.prepare(table).run();
})(tables);