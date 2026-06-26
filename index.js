require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require('discord.js');

const { GoogleGenAI } = require('@google/genai');

// 🎵 MUSIC IMPORTS
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource
} = require('@discordjs/voice');

const ytdl = require('@distube/ytdl-core');

// ===== CONFIG ====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// ==================

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

const player = createAudioPlayer();
let connection = null; // ✅ FIXED GLOBAL CONNECTION

// BOT READY
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// MESSAGE HANDLER
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !ping
    if (message.content === '!ping') {
        return message.reply('Pong! 🏓');
    }

    // !help
    if (message.content === '!help') {
        return message.reply(`
**Commands**
!ping
!help
!server
!join
!leave
!play <url>
!stop
        `);
    }

    // !server
    if (message.content === '!server') {
        return message.reply(`📌 Server: ${message.guild.name}\n👥 Members: ${message.guild.memberCount}`);
    }

    // 🎵 JOIN (FIXED)
    if (message.content === '!join') {
    console.log("STEP 1");

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
        console.log("STEP 2");
        return message.reply("❌ Voice channel join karo");
    }

    console.log("STEP 3");

    try {
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        console.log("STEP 4");

        await message.channel.send("✅ Joined command executed");
    } catch (err) {
        console.error("JOIN ERROR:", err);
        await message.channel.send("❌ Join failed");
    }
}

    // 🎵 PLAY (FIXED)
    if (message.content.startsWith('!play')) {
        const url = message.content.split(' ')[1];

        if (!url || !ytdl.validateURL(url)) {
            return message.reply('❌ Valid YouTube link do');
        }

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply('❌ Pehle voice channel join karo');
        }

        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });
        }

        const stream = ytdl(url, { filter: 'audioonly' });
        const resource = createAudioResource(stream);

        player.play(resource);
        connection.subscribe(player);

        return message.reply('🎶 Now playing music...');
    }

    // ⏹ STOP
    if (message.content === '!stop') {
        player.stop();
        return message.reply('⏹️ Stopped music');
    }

    // 👋 LEAVE (FIXED)
    if (message.content === '!leave') {
        try {
            if (connection) {
                connection.destroy();
                connection = null;
            }

            return message.reply('👋 Left voice channel');
        } catch (error) {
            console.error(error);
            return message.reply('❌ Leave failed');
        }
    }

    // 🤖 AI
    if (message.mentions.has(client.user)) {
        try {
            let prompt = message.content
                .replace(`<@${client.user.id}>`, '')
                .replace(`<@!${client.user.id}>`, '')
                .trim();

            if (!prompt) return message.reply('Hello! Ask me something.');

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            let text = response.text || 'No response';

            if (text.length > 1900) text = text.substring(0, 1900);

            return message.reply(text);

        } catch (error) {
            console.error(error);
            return message.reply('❌ AI error');
        }
    }
});

client.login(DISCORD_TOKEN);