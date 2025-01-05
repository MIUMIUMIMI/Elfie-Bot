const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ComponentType,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("настройки")
    .setDescription("Настройка сервера")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        content:
          "У вас недостаточно прав для использования этой команды. Только администраторы могут изменять настройки.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Настройки сервера")
      .setDescription(
        "Добро пожаловать в настройки! Здесь вы можете задать место для отправки уведомлений и настроить параметры аудита.\n\nВыберите категорию из списка ниже, чтобы продолжить."
      )
      .setColor(0x3498db);

    const categories = [{ label: "Настройки аудита", value: "audit_settings" }];

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_category")
        .setPlaceholder("Выберите категорию")
        .addOptions(categories)
    );

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await interaction.editReply({
        embeds: [embed],
        components: [selectMenu],
      });
    } catch (error) {
      console.error("Ошибка при отправке первоначального сообщения:", error);
      return interaction.followUp({
        content: "Произошла ошибка при отправке сообщения.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelectMenu,
      time: 600000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "Вы не инициировали эту настройку.",
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        await i.deferUpdate();
      } catch (error) {
        console.error("Ошибка при подтверждении обновления:", error);
        return i.followUp({
          content: "Произошла ошибка при обработке взаимодействия.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (i.values[0] === "audit_settings") {
        try {
          const auditEmbed = new EmbedBuilder()
            .setTitle("Настройки аудита")
            .setDescription("Выберите событие для настройки.")
            .setColor(0x3498db);

          const auditEvents = [
            { label: "Сообщение создано", value: "messageCreate" },
            { label: "Сообщение изменено", value: "messageUpdate" },
            { label: "Сообщение удалено", value: "messageDelete" },
            { label: "Участник присоединился", value: "guildMemberAdd" },
            { label: "Участник покинул", value: "guildMemberRemove" },
            { label: "Канал создан", value: "channelCreate" },
            { label: "Канал удален", value: "channelDelete" },
          ];

          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("audit_event_select")
              .setPlaceholder("Выберите событие")
              .addOptions(auditEvents)
          );

          await i.editReply({
            embeds: [auditEmbed],
            components: [row],
          });
        } catch (error) {
          console.error("Ошибка при обработке выбора категории:", error);
          return i.followUp({
            content: "Произошла ошибка при обработке выбора.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } else if (i.customId === "audit_event_select") {
        const selectedEvent = i.values[0];
        try {
          await i.editReply({
            content: `Выбрано событие аудита: ${selectedEvent}`,
            components: [],
          });
          console.log(
            `Настройка аудита для события ${selectedEvent} запрошена пользователем ${i.user.tag}`
          );
        } catch (error) {
          console.error("Ошибка при обработке выбора события аудита:", error);
          return i.followUp({
            content: "Произошла ошибка при обработке выбора события.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        try {
          await interaction.followUp({
            content: "Время ожидания истекло. Настройка не завершена.",
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Ошибка при отправке сообщения о таймауте:", error);
        }
      }
    });
  },
};
