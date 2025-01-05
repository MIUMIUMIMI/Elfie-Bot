const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const users = require('../data/users.json');
const usersDataPath = './data/users.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('выдать')
        .setDescription('Выдаёт монеты участнику.')
        .addUserOption(option =>
            option.setName('пользователь')
                .setDescription('Участник, которому выдать монеты.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('количество')
                .setDescription('Количество монет.')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: 'У вас нет прав для выполнения этой команды.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('пользователь');
        const amount = interaction.options.getInteger('количество');
        const senderId = interaction.user.id;

        if (targetUser.bot) {
            return interaction.reply({ content: 'Нельзя выдавать монеты ботам.', ephemeral: true });
        }

        if (targetUser.id === senderId) {
            return interaction.reply({ content: 'Нельзя выдавать монеты самому себе.', ephemeral: true });
        }

        if (amount <= 0) {
            return interaction.reply({ content: 'Сумма должна быть больше 0!', ephemeral: true });
        }

        if (!users[targetUser.id]) {
            users[targetUser.id] = { balance: 0 };
        }

        users[targetUser.id].balance += amount;

        fs.writeFileSync(usersDataPath, JSON.stringify(users, null, 2));
        await interaction.reply(`Выдача ${amount} монет <@${targetUser.id}> успешна.`);
    },
};

