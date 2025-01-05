require("dotenv").config(); // Убедитесь, что dotenv загружен в начале файла

const { Client, EmbedBuilder } = require("discord.js");
const axios = require("axios");

// Хранение состояния для каждого сервера
const serverStates = {};

const TENOR_API_KEY = process.env.TENOR_API_KEY;
if (!TENOR_API_KEY) {
  console.error("TENOR_API_KEY не установлен. Проверьте файл .env");
  throw new Error("TENOR_API_KEY не установлен");
}

// Ручные триггер-слова с фиксированными гифками и сообщениями
const manualTriggers = {
  депрессия: {
    message: "Депрессия в 0 лет",
    gif: "https://media1.tenor.com/m/XV3CXGrMo1wAAAAd/tokyo-ghoul.gif",
  },
  грусно: {
    gif: "https://media1.tenor.com/m/6EQ2aeffrU0AAAAd/anime-sad.gif",
  },
  верим: {
    gif: "https://media1.tenor.com/m/A4TCDgDR93AAAAAd/komaru-verim-verim.gif",
  },
  скоро: {
    gif: "https://media1.tenor.com/m/T2EV2FXEmdAAAAAd/cat-%D0%BA%D0%BE%D1%82.gif",
  },
  увы: {
    gif: "https://media1.tenor.com/m/dlAoP0o5uYEAAAAd/%D1%83%D0%B2%D1%8B.gif",
  },
  монстр: {
    gif: "https://media1.tenor.com/m/HIMyCAW6l60AAAAd/death-stranding-monster-energy-drink.gif",
  },
  отказ: {
    gif: "https://media1.tenor.com/m/FRPIOdyySTEAAAAd/%D0%BE%D1%82%D0%BA%D0%B0%D0%B7%D0%B0%D0%BD%D0%BE.gif",
  },
  спать: {
    gif: "https://media1.tenor.com/m/NbBpDVlxpzEAAAAd/ilknur-seher-ilknurs0.gif",
  },
  бедни: {
    gif: "https://media1.tenor.com/m/RrjRybIpmMwAAAAd/cat-kitten.gif",
  },
  устал: {
    gif: "https://media1.tenor.com/m/nmcUiJVSvdwAAAAd/%D1%83%D1%81%D1%82%D0%B0%D0%BB-%D1%83%D1%85%D0%BE%D0%B6%D1%83.gif",
  },
  ого: {
    gif: "https://media1.tenor.com/m/QGIuFImYN-8AAAAd/kesha.gif",
  },
  бан: {
    gif: "https://media1.tenor.com/m/4LRF95lq-v4AAAAd/komaru-comaru.gif",
  },
  йоу: {
    gif: "https://media1.tenor.com/m/EamuXZ0ieTUAAAAd/chika-fujiwara.gif",
  },
};

// Триггер-слова для запросов к API
const apiTriggers = {
  котик: {
    joke: "Котики хорошие, лишнего не скажут",
    query: "cute kittens",
  },
  собака: {
    joke: "Собакены очень милые!",
    query: "anime dog",
  },
};

/**
 * @param {Client} client
 */

// Активация бэнгов
const activateBangs = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return; // Игнорируем сообщения ботов

    const serverId = message.guild.id;

    // Инициализируем состояние сервера, если его нет
    if (!serverStates[serverId]) {
      serverStates[serverId] = {
        lastUsed: 0,
        messageCount: 5,
      };
    }

    const now = Date.now();
    const cooldownAmount = 60 * 1000; // 1 минута в миллисекундах

    const serverState = serverStates[serverId];

    serverState.messageCount++;

    // Проверяем условия кулдауна
    if (now - serverState.lastUsed < cooldownAmount) {
      console.log(`Cooldown active on server ${serverId}, skipping trigger.`);
      return;
    }

    if (serverState.messageCount < 5) {
      console.log(
        `Message count on server ${serverId}: ${serverState.messageCount} < 5`
      );
      return;
    }

    // Проверяем ручные триггер-слова
    const manualTrigger = Object.keys(manualTriggers).find((word) =>
      message.content.toLowerCase().includes(word)
    );
    if (manualTrigger) {
      const triggerData = manualTriggers[manualTrigger];
      const embed = new EmbedBuilder()
        .setColor("#B9A5E2") // Цвет эмбеда
        .setImage(triggerData.gif); // Гифка

      // Если сообщение указано, добавляем заголовок
      if (triggerData.message) {
        embed.setTitle(triggerData.message);
      }

      serverState.lastUsed = now;
      serverState.messageCount = 0;
      message.channel.send({ embeds: [embed] });
      return;
    }

    // Проверяем API триггер-слова
    const apiTrigger = Object.keys(apiTriggers).find((word) =>
      message.content.toLowerCase().includes(word)
    );
    if (apiTrigger) {
      try {
        const triggerData = apiTriggers[apiTrigger];
        const response = await axios.get(
          `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
            triggerData.query
          )}&key=${TENOR_API_KEY}&client_key=Elfie&limit=30`
        );
        const gifResults = response.data.results;

        if (gifResults.length > 0) {
          // Фильтруем гифки, у которых content_description не содержит "text" или схожих слов
          const filteredGifs = gifResults.filter((gif) => {
            const description = gif.content_description || "";
            return !/(text|caption|subtitle)/i.test(description);
          });

          // Выбираем случайную гифку из отфильтрованных
          const randomGif =
            filteredGifs[Math.floor(Math.random() * filteredGifs.length)];
          const gifUrl = randomGif?.media_formats?.gif?.url;

          if (gifUrl) {
            const embed = new EmbedBuilder()
              .setColor("#B9A5E2") // Цвет эмбеда
              .setTitle(triggerData.joke) // Шутка
              .setImage(gifUrl); // Гифка

            serverState.lastUsed = now;
            serverState.messageCount = 0;
            message.channel.send({ embeds: [embed] });
          } else {
            console.log("Нет ссылки на GIF в формате media_formats", randomGif);
          }
        } else {
          console.log(
            `По запросу "${triggerData.query}" GIF-файлы не найдены.`
          );
        }
      } catch (error) {
        console.error(
          `Ошибка при запросе к Tenor для слова "${apiTrigger}":`,
          error
        );
      }
    }
  });
};

module.exports = activateBangs;
