const { REST, Routes } = require("discord.js");
const fs = require("fs");
require("dotenv").config(); // Загружаем переменные окружения из .env

// Токен и ID клиента из .env
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// Загружаем команды из папки
const commands = [];
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// Отправка команд в Discord
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Начинаем обновление слэш-команд...");

    // Получаем список текущих команд с сервера
    const existingCommands = GUILD_ID
      ? await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID))
      : await rest.get(Routes.applicationCommands(CLIENT_ID));

    // Удаляем команды, которых нет в локальной папке commands
    for (const command of existingCommands) {
      if (!commands.some((c) => c.name === command.name)) {
        console.log(
          `Удаляем устаревшую команду: ${command.name} (${command.id})`
        );
        GUILD_ID
          ? await rest.delete(
              Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id)
            )
          : await rest.delete(Routes.applicationCommand(CLIENT_ID, command.id));
        console.log(`Команда "${command.name}" успешно удалена.`);
      }
    }

    // Обновляем или добавляем команды, которых еще нет на сервере
    const updatedCommands = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);

    await rest.put(updatedCommands, { body: commands });
    console.log("Слэш-команды успешно зарегистрированы и обновлены.");
  } catch (error) {
    console.error("Ошибка при обновлении слэш-команд:", error);
  }
})();
