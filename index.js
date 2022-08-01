// Require the necessary discord.js classes
const {Client, GatewayIntentBits} = require('discord.js');
const {token, user} = require('./config.json');
const {joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType} = require('@discordjs/voice');
const {createReadStream} = require('node:fs');
const {join} = require('node:path');
const fs = require('fs');

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
        return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
        const f = join(directoryPath, file)
        console.log("Loading: ", f)
        audioFiles.push(f)
    });

    console.log(`Set audioInd=${audioInd}=${audioFiles[audioInd]}`);
    console.log(`Found ${audioFiles.length} files`)
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // check for bot
    if (oldState.member.user.bot) return;
    if (oldState.member.user.username !== user) return;

    // check if leaving
    if (newState.channel === null) {
        console.log("Left voice: ", oldState.member.user.username)
        return;
    }

    console.log("Joined voice: ", oldState.member.user.username)

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

    console.log(`Set audioInd=${audioInd}=${audioFiles[audioInd]}`)

    player.play(resource);

    connection.subscribe(player);

})

// Login to Discord with your client's token
client.login(token);
