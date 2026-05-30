// tyrexmain.js - Simple Heroku Bot
import chalk from 'chalk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';

const BOT_NAME = '༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒';
const CHANNEL_JID = '120363424973782944@newsletter';
const OWNER_NUMBER = '255650583044';

const REACTIONS = ['❤️', '🔥', '⭐', '👑', '💎', '✨', '🌟', '💪', '🎯', '🚀', '💯', '👏', '🙌', '👍', '💙', '💚', '💛', '💜', '🧡', '💝', '💖', '💗'];

console.log(chalk.cyan(`
╔════════════════════════════════════════════════════════════════╗
║   🧛 ${BOT_NAME}
║   ⚡ POWERED BY TYREX KSH TECH
║   📢 Channel: ${CHANNEL_JID}
║   👤 Owner: ${OWNER_NUMBER}
║   ❤️ Auto React: ACTIVE
║   🚀 Heroku Mode
╚════════════════════════════════════════════════════════════════╝
`));

// Check SESSION_ID
const SESSION_ID = process.env.SESSION_ID;
if (!SESSION_ID || SESSION_ID === '') {
    console.log(chalk.red('❌ SESSION_ID is required!'));
    console.log(chalk.yellow('Run: heroku config:set SESSION_ID="your_session_id"'));
    process.exit(1);
}

console.log(chalk.green(`✅ SESSION_ID loaded\n`));

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
            const { connection, qr } = update;
            
            if (qr) {
                console.log(chalk.yellow('📱 Scan QR code to login'));
            }
            
            if (connection === 'open') {
                console.log(chalk.green('\n✅ Bot Connected Successfully!\n'));
                
                // Follow channel
                try {
                    await sock.newsletterFollow(CHANNEL_JID);
                    console.log(chalk.green('✅ Auto-followed channel!'));
                } catch(e) {
                    console.log(chalk.yellow('⚠️ Could not follow channel'));
                }
                
                // Notify owner
                try {
                    await sock.sendMessage(OWNER_NUMBER + '@s.whatsapp.net', {
                        text: `✅ *${BOT_NAME} is ONLINE!*\n\n📢 Channel: ${CHANNEL_JID}\n❤️ Auto React: ACTIVE\n📅 Time: ${new Date().toLocaleString()}`
                    });
                } catch(e) {}
            }
            
            if (connection === 'close') {
                console.log(chalk.yellow('⚠️ Connection closed. Reconnecting...'));
                setTimeout(() => start(), 5000);
            }
        });
        
        // Auto react to channel posts
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message) return;
            
            if (msg.key?.remoteJid === CHANNEL_JID) {
                const react = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
                try {
                    await sock.sendMessage(CHANNEL_JID, {
                        react: { text: react, key: msg.key }
                    });
                    console.log(`❤️ Auto-reacted: ${react}`);
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
        console.error(chalk.red('❌ Error:'), error.message);
        setTimeout(() => start(), 10000);
    }
}

start();
