const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

// Создаем нового клиента
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Загружаем слэш-команды
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  } catch (error) {
    console.error(`Error loading command ${file}:`, error);
  }
}

// Загружаем бэнг-команды
const registerBangCommands = require("./commands/bangs/bang-commands");

// Обработчик события 'ready'
client.once("ready", () => {
  console.log(`Бот ${client.user.tag} успешно запущен`);
  registerBangCommands(client); // Регистрируем бэнг-команды
});

// Обработчик слэш-команд
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
    if (!interaction.message) {
      console.error("interaction.message is undefined:", interaction);
      return interaction.reply({
        content: "Сообщение не найдено.",
        ephemeral: true,
      });
    }

    try {
      // Обработка компонентов (кнопок, меню)
      console.log("Взаимодействие с компонентом:", interaction.customId);
      await interaction.reply({
        content: "Обработано взаимодействие с компонентом",
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        "Ошибка при обработке взаимодействия с компонентом:",
        error
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Произошла ошибка!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "Произошла ошибка!",
          ephemeral: true,
        });
      }
    }
  }
});

client.login(process.env.TOKEN);
