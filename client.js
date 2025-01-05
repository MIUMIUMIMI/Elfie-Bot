const { Client, GatewayIntentBits } = require('discord.js');

// Создаем клиента
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });  // Добавьте GuildMembers для получения информации о пользователях

module.exports = { client };
