const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const episodes = require("./episodes");
const token = process.env.TELEGRAM_TOKEN;

console.log("[TARDIS console] Doctor Who Episodes Battle Bot launched!")

const bot = new TelegramBot(token, {polling: true});

bot.setMyCommands([
    {
        command: '/botwho',
        description: 'Get a brief explanation'
    }
])

bot.onText(/\/botwho/, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Hi! I'm a bot. I live into the TARDIS console. I generate random episodes battles to keep the Doctor's companions entertained\n\nWrite /battle to generate a random battle`);
})

bot.onText(/\/battle/, (msg, match) => {
    let options = [];
    for (let i = 0; i < 4; i++) {
        let episode = episodes[Math.floor(Math.random() * episodes.length)];
        while (options.find(o => o === episode)){
            episode = episodes[Math.floor(Math.random() * episodes.length)];
        }
        options.push(episode);
    }
    bot.sendPoll(msg.chat.id, 'Dear companion, what adventure did you enjoy the most?', options, {
        is_anonymous: false,
        allows_multiple_answers: false
    })
})
