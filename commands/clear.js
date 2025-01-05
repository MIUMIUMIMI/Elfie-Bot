const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("очистить")
    .setDescription(
      "Удаляет сообщения в текущем канале по заданным фильтрам не более 100 за раз и не старше 2-х недель."
    )
    .addIntegerOption((option) =>
      option
        .setName("количество")
        .setDescription("Количество сообщений для удаления (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((option) =>
      option
        .setName("участник")
        .setDescription("Удаление сообщений указанного участника")
    )
    .addStringOption((option) =>
      option
        .setName("длительность")
        .setDescription(
          "Удалять сообщения за временной промежуток (например, 1день, 2часы, 30минут)"
        )
    ),
  async execute(interaction) {
    // Проверяем права пользователя
    const member = interaction.member;
    if (
      !member.permissions.has(PermissionFlagsBits.Administrator) &&
      !member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return interaction.reply({
        content:
          "У вас недостаточно прав для использования этой команды. Требуются права администратора или управления сообщениями.",
        ephemeral: true,
      });
    }

    // Откладываем ответ для предотвращения ошибки "Unknown interaction"
    await interaction.deferReply({ ephemeral: true });

    const count = interaction.options.getInteger("количество");
    const user = interaction.options.getUser("участник");
    const duration = interaction.options.getString("длительность");

    if (!count && !user && !duration) {
      return interaction.editReply({
        content:
          "Необходимо указать хотя бы один фильтр: количество, участник или длительность.",
      });
    }

    const channel = interaction.channel;

    try {
      // Получаем последние сообщения из канала
      let messages = await channel.messages.fetch({ limit: 100 });

      // Фильтруем сообщения по заданным условиям
      let filteredMessages = Array.from(messages.values());

      if (user) {
        filteredMessages = filteredMessages.filter(
          (msg) => msg.author.id === user.id
        );
      }

      if (duration) {
        const now = Date.now();
        const durationMs = parseDuration(duration);
        if (!durationMs) {
          return interaction.editReply({
            content:
              "Неверный формат длительности. Используйте например 1день, 2часы, 30минут.",
          });
        }
        filteredMessages = filteredMessages.filter(
          (msg) => now - msg.createdTimestamp <= durationMs
        );
      }

      if (count) {
        filteredMessages = filteredMessages.slice(0, count);
      }

      // Удаляем сообщения
      for (const msg of filteredMessages) {
        try {
          await msg.delete();
        } catch (err) {
          console.warn(`Ошибка удаления сообщения ID ${msg.id}:`, err);
        }
      }

      return interaction.editReply({
        content: `Удалено ${filteredMessages.length} сообщений${
          user ? ` от ${user.tag}` : ""
        }.`,
      });
    } catch (error) {
      console.error("Ошибка при удалении сообщений:", error);
      return interaction.editReply({
        content: "Произошла ошибка при попытке удалить сообщения.",
      });
    }
  },
};

// Функция для преобразования длительности
function parseDuration(duration) {
  const units = {
    sec: 1000,
    second: 1000,
    seconds: 1000,
    сек: 1000,
    секунда: 1000,
    секунд: 1000,
    m: 60 * 1000,
    min: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    м: 60 * 1000,
    мин: 60 * 1000,
    минута: 60 * 1000,
    минут: 60 * 1000,
    h: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    ч: 60 * 60 * 1000,
    час: 60 * 60 * 1000,
    часов: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    д: 24 * 60 * 60 * 1000,
    день: 24 * 60 * 60 * 1000,
    дней: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    нед: 7 * 24 * 60 * 60 * 1000,
    неделя: 7 * 24 * 60 * 60 * 1000,
    недели: 7 * 24 * 60 * 60 * 1000,
    недель: 7 * 24 * 60 * 60 * 1000,
    mo: 30 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    мес: 30 * 24 * 60 * 60 * 1000,
    месяца: 30 * 24 * 60 * 60 * 1000,
    месяц: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
    г: 365 * 24 * 60 * 60 * 1000,
    год: 365 * 24 * 60 * 60 * 1000,
    года: 365 * 24 * 60 * 60 * 1000,
    лет: 365 * 24 * 60 * 60 * 1000,
  };

  const match = duration.match(/(\d+)([a-zа-я]+)/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  return units[unit] ? value * units[unit] : null;
}
