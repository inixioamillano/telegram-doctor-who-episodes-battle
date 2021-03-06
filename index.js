const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(`mongodb://${process.env.DB_HOST}:27017/doctorwhobattles`, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log("[TARDIS console] Connected to The Library, biggest data base in the universe!");
});

const Vote = mongoose.model('Vote', { 
        chatId: Number,
        episode: String,
        votes: Number
    }
);

const Poll = mongoose.model('Poll', { 
    chatId: Number,
    pollId: String,
    options: [String]
}
);


const newWho = require("./episodes");
const classicWho = require("./serials");
const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, {polling: true});
console.log("[TARDIS console] Doctor Who Episodes Battle Bot launched!");

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
    },{
        command: '/ranking',
        description: 'Get the most voted episodes'
    }
])

bot.onText(/\/botwho/, (msg, match) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hi! I\'m a bot. I live in the TARDIS console.\n' + 
        'I generate random episode battles to keep the Doctor\'s companions entertained.\n\n' + 
        'Write /battle to generate a random battle between modern Doctor Who episodes\n\n' + 
        'Write /classicbattle to generate a random battle between Classic Doctor Who serials\n\n' +
        'Write /timewar to generate a random battle between any episode aired since 1963\n\n' +
        'Write /ranking to get the Top 5 episodes\n\n' +
        'v1.1.1 - Developed by @inixiodev');
})

bot.onText(/\/battle/, (msg, match) => {
    const options = getOptions()
    bot.sendPoll(msg.chat.id, 'Dear companion, what adventure did you enjoy the most? #DoctorWhoBattle', options, {
        is_anonymous: false,
        allows_multiple_answers: false
    })
    .then((message) => {
        new Poll({
            chatId: msg.chat.id,
            pollId: message.poll.id,
            options
        }).save();
    })
})

bot.onText(/\/classicbattle/, (msg, match) => {
    const options = getOptions('classic')
    bot.sendPoll(msg.chat.id, 'Dear companion, what classic adventure did you enjoy the most? #DoctorWhoBattle', options, {
        is_anonymous: false,
        allows_multiple_answers: false
    })
    .then((message) => {
        new Poll({
            chatId: msg.chat.id,
            pollId: message.poll.id,
            options
        }).save();
    })
})

function getTop5(votes){
    return votes.slice(0, 10).map(v => {
        return {
            episode: v._id,
            votes: v.votes
        }
    });
}

bot.onText(/\/ranking/, async (msg, match) => {
    const votesInGroup = await Vote.aggregate([
        {
            $match: {
                chatId: msg.chat.id
            }
        },
        {
            $group: {
                _id: "$episode", 
                votes: { $sum: "$votes" }
            }
        },
        {
            $sort: {votes : -1}
        }
    ]);
    const globalVotes = await Vote.aggregate([
        {
            $group: {
                _id: "$episode", 
                votes: { $sum: "$votes" }
            }
        },
        {
            $sort: {votes : -1}
        }
    ]);
    const totalVotes = await Vote.aggregate([
        {
            $group: {
                _id: '',
                votes: { $sum: '$votes' }
            }
        }, {
            $project: {
                _id: 0,
                votes: '$votes'
            }
        }
    ]);
    const totalInGroup = await Vote.aggregate([
        {
            $match: {
                chatId: msg.chat.id
            }
        },
        {
            $group: {
                _id: '',
                votes: { $sum: '$votes' }
            }
        }, {
            $project: {
                _id: 0,
                votes: '$votes'
            }
        }
    ])
    const medals = ['🥇', '🥈', '🥉'];
    let response = '*TOP 10 EPISODES*\n\nGlobal:\n\n';
    const global = getTop5(globalVotes);
    const inGroup = getTop5(votesInGroup);
    global.forEach((v, i) => {
        response = response + `${medals[i] ? medals[i] : ''} *${v.episode}* (${v.votes} votes)\n`;
    });
    response = response + '\n\nIn this group:\n\n';
    inGroup.forEach((v, i) => {
        response = response + `${medals[i] ? medals[i] : ''} *${v.episode}* (${v.votes} votes)\n`;
    });
    response = response + `\n\nTotal votes: ${totalVotes[0].votes}\nTotal votes in group: ${totalInGroup[0].votes}`;
    bot.sendMessage(msg.chat.id, response, {parse_mode : "Markdown"});
})

bot.onText(/\/timewar/, (msg, match) => {
    const options = getOptions('all')
    bot.sendPoll(msg.chat.id, 'Dear companion, what adventure did you enjoy the most? #DoctorWhoBattle #TimeWar', options, {
        is_anonymous: false,
        allows_multiple_answers: false
    })
    .then((message) => {
        new Poll({
            chatId: msg.chat.id,
            pollId: message.poll.id,
            options
        }).save();
    })
})

bot.on('poll_answer', (p) => {
    const pollId = p.poll_id;
    const optId = p.option_ids[0]; // 0, 1, 2, 3 or 4
    Poll.findOne({pollId}, null, null, (err, poll) => {
        if (!err && poll){
            const episode = poll.options[optId];
            Vote.updateOne({
                chatId: poll.chatId,
                episode
            }, {$inc: {votes: 1}},
            { upsert : true },
            (err, res) => {
                if (!err) {
                    console.log(res);
                    console.log("[TARDIS console] Vote saved!")
                } else {
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }
    })
})

bot.on('polling_error', (e) => console.log('error', e))