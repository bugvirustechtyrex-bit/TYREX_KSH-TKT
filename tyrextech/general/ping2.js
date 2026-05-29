// ============================================
// PING COMMAND - Check if bot is alive
// Powered by SILA TECH
// ============================================

export default {
    name: 'ping2',
    description: 'Check if bot is alive and running',
    category: 'general',
    alias: ['p2', 'pong2'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const uptime = process.uptime();
        const styledName = config.styledName || config.BOT_NAME;
        
        await sock.sendMessage(chatId, { 
            text: `🌸🫵 Pong! 84ms 🌷\n\n🌺 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐓𝐲𝐫𝐞𝐱_𝐊𝐬𝐡 𝐓𝐞𝐜𝐡 🌺`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
