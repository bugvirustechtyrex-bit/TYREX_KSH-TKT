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
            text: `*╭┈┈┄⊰ ${styledName} STATUS ⊱┄┄┄◈*\n\n*┋ •> 🤖 Bot:* ${styledName}\n*┋ •> 📌 Version:* ${config.BOT_VERSION}\n*┋ •> ⏱️ Uptime:* ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s\n*┋ •> 💬 Prefix:* ${config.isPrefixless ? 'none' : prefix}\n*┋ •> ✅ Status:* 🟢 ACTIVE\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
