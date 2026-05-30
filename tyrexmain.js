// tyrexmain.js - With QR code in logs
import chalk from 'chalk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';

const BOT_NAME = '༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒';
const CHANNEL_JID = '120363424973782944@newsletter';
const OWNER_NUMBER = '255650583044';

const REACTIONS = ['❤️', '🔥', '⭐', '👑', '💎', '✨', '🌟', '💪', '🎯', '🚀', '💯', '👏'];

console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🧛 ${BOT_NAME}
║   ⚡ POWERED BY TYREX KSH TECH
║   📢 Channel: ${CHANNEL_JID}
║   👤 Owner: ${OWNER_NUMBER}
║   ❤️ Auto React: ACTIVE
║   🚀 Heroku Mode
╚════════════════════════════════════════════════════════════════╝
`);

const SESSION_ID = process.env.SESSION_ID;
if (!SESSION_ID || SESSION_ID === '') {
    console.log('❌ SESSION_ID is required!');
    console.log('Run: heroku config:set SESSION_ID="your_session_id"');
    process.exit(1);
}

console.log('✅ SESSION_ID loaded\n');

async function start() {
    try {
        const { default: makeWASocket, useMultiFileAuthState, Browsers } = await import('@whiskeysockets/baileys');
        
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
                console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP:\n');
                console.log(qr);
                console.log('\n1. Open WhatsApp on your phone');
                console.log('2. Tap Settings → Linked Devices');
                console.log('3. Tap "Link a Device"');
                console.log('4. Scan this QR code\n');
            }
            
            if (connection === 'open') {
                console.log('\n✅ Bot Connected Successfully!\n');
                
                try {
                    await sock.newsletterFollow(CHANNEL_JID);
                    console.log('✅ Auto-followed channel!');
                } catch(e) {
                    console.log('⚠️ Could not follow channel');
                }
                
                try {
                    await sock.sendMessage(OWNER_NUMBER + '@s.whatsapp.net', {
                        text: `✅ *${BOT_NAME} is ONLINE!*\n\n📢 Channel: ${CHANNEL_JID}\n❤️ Auto React: ACTIVE\n📅 Time: ${new Date().toLocaleString()}`
                    });
                } catch(e) {}
            }
            
            if (connection === 'close') {
                console.log('⚠️ Connection closed. Reconnecting...');
                setTimeout(() => start(), 5000);
            }
        });
        
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
        
        setInterval(async () => {
            try {
                await sock.sendPresenceUpdate('available');
            } catch(e) {}
        }, 60000);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        setTimeout(() => start(), 10000);
    }
}

start();
