const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const users = require("../data/users.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("баланс")
    .setDescription("Показывает топ пользователей по балансу."),

  async execute(interaction) {
    const userList = Object.entries(users)
      .filter(([_, userData]) => userData.balance > 0)
      .map(([userId, userData]) => ({
        id: userId,
        balance: userData.balance,
      }))
      .sort((a, b) => b.balance - a.balance); // Сортировка по балансу (от большего к меньшему)

    const pageSize = 10; // Количество записей на страницу
    const totalUsers = userList.length;
    const totalPages = Math.ceil(totalUsers / pageSize);
    let currentPage = 1;

    if (totalUsers === 0) {
      return interaction.reply({
        content: "Нет пользователей с положительным балансом.",
        ephemeral: true,
      });
    }

    const generateEmbed = async (page) => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const currentUsers = userList.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle(
          `Страница ${page} из ${totalPages} — Всего участников: ${totalUsers}`
        )
        .setDescription("**Баланс-лист сервера:**")
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setColor("#B9A5E2"); // Цвет для эмбеда

      let description = "";
      for (const [index, user] of currentUsers.entries()) {
        const rank = start + index + 1;
        const member = await interaction.guild.members
          .fetch(user.id)
          .catch(() => null);
        const userName = member ? `${member.user}` : `Пользователь ${user.id}`;
        description += `**${rank}.** ${userName} — ${user.balance} 🪙\n`;
      }

      const userPosition =
        userList.findIndex((u) => u.id === interaction.user.id) + 1;
      if (userPosition > 0) {
        const userBalance = users[interaction.user.id]?.balance || 0;
        description += `\n**Твоя позиция:**\n${userPosition}.${interaction.user} — ${userBalance} 🪙`;
      } else {
        description += `\n**Твоя позиция:**\nНе найдено.`;
      }

      embed.setDescription(description);
      return embed;
    };

    const generateButtons = (page, totalPages) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("first")
          .setEmoji({ id: "1322532037466390598" }) // << Двойная стрелка влево
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 1), // Отключить на первой странице
        new ButtonBuilder()
          .setCustomId("previous")
          .setEmoji({ id: "1322532062288412722" }) // < Одиночная стрелка влево
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 1), // Отключить на первой странице
        new ButtonBuilder()
          .setCustomId("next")
          .setEmoji({ id: "1322532074883907645" }) // > Одиночная стрелка вправо
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages), // Отключить на последней странице
        new ButtonBuilder()
          .setCustomId("last")
          .setEmoji({ id: "1322532088464936980" }) // >> Двойная стрелка вправо
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages), // Отключить на последней странице
        new ButtonBuilder()
          .setCustomId("delete")
          .setEmoji({ id: "1322532102515855430" }) // Мусорка
          .setStyle(ButtonStyle.Danger)
      );
    };

    const embedMessage = await interaction.reply({
      embeds: [await generateEmbed(currentPage)],
      components: [generateButtons(currentPage, totalPages)], // Передаем текущую страницу и общее количество
    });

    const reply = await interaction.fetchReply(); // Получаем ответ после отправки

    const collector = embedMessage.createMessageComponentCollector({
      time: 60000, // 1 минута
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        return buttonInteraction.reply({
          content: "Вы не можете управлять этим сообщением.",
          ephemeral: true,
        });
      }

      switch (buttonInteraction.customId) {
        case "first":
          currentPage = 1;
          break;
        case "previous":
          if (currentPage > 1) currentPage--;
          break;
        case "next":
          if (currentPage < totalPages) currentPage++;
          break;
        case "last":
          currentPage = totalPages;
          break;
        case "delete":
          collector.stop();
          return buttonInteraction.message.delete();
      }

      await buttonInteraction.update({
        embeds: [await generateEmbed(currentPage)],
        components: [generateButtons(currentPage, totalPages)], // Передаем текущую страницу и общее количество
      });
    });

    collector.on("end", () => {
      embedMessage.edit({ components: [] });
    });
  },
};
