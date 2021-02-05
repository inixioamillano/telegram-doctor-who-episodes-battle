const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const newWho = require("./episodes");
const classicWho = require("./serials");
const token = process.env.TELEGRAM_TOKEN;

console.log("[TARDIS console] Doctor Who Episodes Battle Bot launched!")

const bot = new TelegramBot(token, {polling: true});

const getOptions = (category) => {
    let options = [];
    let episodes = newWho;
    if (category){
        if (category === 'classic') {
            episodes = classicWho;
        } else if (category === 'all') {
            episodes = episodes.concat(classicWho);
        }
    }
    for (let i = 0; i < 4; i++) {
        let episode = episodes[Math.floor(Math.random() * episodes.length)];
        while (options.find(o => o === episode)){
            episode = episodes[Math.floor(Math.random() * episodes.length)];
        }
        options.push(episode);
    }
    return options;
}

bot.setMyCommands([
    {
        command: '/botwho',
        description: 'Get a brief explanation'
    },
    {
        command: '/battle',
        description: 'Generate random battle between modern Doctor Who episodes'
    },
    {
        command: '/classicbattle',
        description: 'Generate random battle between Classic Who serials'
    },
    {
        command: '/timewar',
        description: 'Generate random battle between Classic and New Who episodes'
    }
])

bot.onText(/\/botwho/, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hi! I\'m a bot. I live in the TARDIS console.\n' + 
        'I generate random episode battles to keep the Doctor\'s companions entertained.\n\n' + 
        'Write /battle to generate a random battle between modern Doctor Who episodes\n\n' + 
        'Write /classicbattle to generate a random battle between Classic Doctor Who serials\n\n' +
        'Write /timewar to generate a random battle between any episode aired since 1963\n\n' +
        'v1.0.1 - Developed by @inixiodev');
})

bot.onText(/\/battle/, (msg, match) => {
    const options = getOptions()
    bot.sendPoll(msg.chat.id, 'Dear companion, what adventure did you enjoy the most? #DoctorWhoBattle', options, {
        is_anonymous: false,
        allows_multiple_answers: false
    })
})

bot.onText(/\/classicbattle/, (msg, match) => {
    const options = getOptions('classic')
    bot.sendPoll(msg.chat.id, 'Dear companion, what classic adventure did you enjoy the most? #DoctorWhoBattle', options, {
        is_anonymous: false,
        allows_multiple_answers: false
    })
})

bot.onText(/\/timewar/, (msg, match) => {
    const options = getOptions('all')
    bot.sendPoll(msg.chat.id, 'Dear companion, what adventure did you enjoy the most? #DoctorWhoBattle #TimeWar', options, {
        is_anonymous: false,
        allows_multiple_answers: false
    })
})

bot.on('polling_error', (e) => console.log(e))