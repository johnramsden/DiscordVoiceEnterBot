// Require the necessary discord.js classes
const {Client, GatewayIntentBits} = require('discord.js');
const {token, user} = require('./config.json');
const {joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType} = require('@discordjs/voice');
const {createReadStream} = require('node:fs');
const {join} = require('node:path');
const fs = require('fs');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        winston.format.prettyPrint()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: 'info.log' }),
    ],
});

// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

const audioFiles = []
let audioInd = 0

const directoryPath = join(__dirname, 'audio');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return logger.info('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
        const f = join(directoryPath, file)
        logger.info("Loading: ", f)
        audioFiles.push(f)
    });

    logger.info(`Set audioInd=${audioInd}=${audioFiles[audioInd]}`);
    logger.info(`Found ${audioFiles.length} files`)
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    logger.info('Ready!');
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // check for bot
    if (oldState.member.user.bot) return;
    if (oldState.member.user.username !== user) return;

    // check if leaving
    if (newState.channel === null) {
        logger.info("Left voice: ", oldState.member.user.username)
        return;
    }

    logger.info("Joined voice: ", oldState.member.user.username)

    const connection = joinVoiceChannel({
        channelId: newState.channel.id,
        guildId: newState.guild.id,
        adapterCreator: newState.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    let resource = createAudioResource(createReadStream(audioFiles[audioInd], {
        inputType: StreamType.OggOpus,
    }));
    audioInd++
    if (audioInd >= audioFiles.length) {
        audioInd = 0
    }

    logger.info(`Set audioInd=${audioInd}=${audioFiles[audioInd]}`)

    player.play(resource);

    connection.subscribe(player);

})

// Login to Discord with your client's token
client.login(token);
