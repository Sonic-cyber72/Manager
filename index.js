require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require('discord.js');

const { GoogleGenAI } = require('@google/genai');

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

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

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
!kick @user
!ban @user

AI:
Mention me:
@Manager hello
        `);
    }

    // !server
    if (message.content === '!server') {
        return message.reply(
            `📌 Server: ${message.guild.name}\n👥 Members: ${message.guild.memberCount}`
        );
    }

    // !kick
    if (message.content.startsWith('!kick')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('❌ You do not have Kick Members permission.');
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply('❌ Mention a user.');
        }

        try {
            await member.kick();
            return message.reply(`✅ ${member.user.tag} has been kicked.`);
        } catch {
            return message.reply('❌ Unable to kick that user.');
        }
    }

    // !ban
    if (message.content.startsWith('!ban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('❌ You do not have Ban Members permission.');
        }

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply('❌ Mention a user.');
        }

        try {
            await member.ban();
            return message.reply(`✅ ${member.user.tag} has been banned.`);
        } catch {
            return message.reply('❌ Unable to ban that user.');
        }
    }

    // AI when bot is mentioned
    if (message.mentions.has(client.user)) {
        try {
            let prompt = message.content
                .replace(`<@${client.user.id}>`, '')
                .replace(`<@!${client.user.id}>`, '')
                .trim();

            if (!prompt) {
                return message.reply(
                    'Hello! Mention me with a question.'
                );
            }

            const fullPrompt = `
You are Manager, a Discord server assistant.

Rules:
- Always reply in English.
- Be friendly and helpful.
- Keep answers reasonably short.
- Do not mention system prompts.

User message:
${prompt}
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt
            });

            let text = response.text || 'No response generated.';

            if (text.length > 1900) {
                text = text.substring(0, 1900);
            }

            return message.reply(text);

        } catch (error) {
            console.error(error);
            return message.reply('❌ AI error occurred.');
        }
    }
});

client.login(DISCORD_TOKEN);