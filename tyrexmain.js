// tyrexmain.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

const BOT_NAME = process.env.BOT_NAME || '༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒';
const CHANNEL_JID = '120363424973782944@newsletter';
const OWNER_NUMBER = '255650583044';
const REACTIONS = ['❤️', '🔥', '⭐', '👑', '💎', '✨', '🌟', '💪', '🎯', '🚀', '💯', '👏'];

async function start() {
    try {
        const { default: makeWASocket, useMultiFileAuthState, Browsers } = await import('@whiskeysockets/baileys');
        
        // Create session directory
        if (!fs.existsSync('./session')) {
            fs.mkdirSync('./session', { recursive: true });
        }
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        
        const sock = makeWASocket({
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: true,
            markOnlineOnConnect: true
        });
        
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                console.log(chalk.green('✅ Bot Connected!'));
                console.log(chalk.cyan(`📢 Auto-following channel: ${CHANNEL_JID}`));
                
                try {
                    await sock.newsletterFollow(CHANNEL_JID);
                    console.log(chalk.green('✅ Followed channel!'));
                } catch(e) {
                    console.log(chalk.yellow('⚠️ Could not follow channel'));
                }
            }
        });
        
        // Auto react to channel
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message) return;
            
            if (msg.key?.remoteJid === CHANNEL_JID) {
                const react = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
                try {
                    await sock.sendMessage(CHANNEL_JID, {
                        react: { text: react, key: msg.key }
                    });
                    console.log(`❤️ Reacted: ${react}`);
                } catch(e) {}
            }
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        // Keep alive
        setInterval(async () => {
            try {
                await sock.sendPresenceUpdate('available');
            } catch(e) {}
        }, 60000);
        
    } catch (error) {
        console.error('Error:', error.message);
        setTimeout(start, 5000);
    }
}

start();
