export default {
    name: 'alive',
    description: 'Check if bot is alive',
    category: 'general',
    alias: ['ping', 'status'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const message = `*╭┈┈┄⊰ ${config.styledName} STATUS ⊱┄┄┄◈*\n\n*┋ •> 🤖 Bot:* ${config.styledName}\n*┋ •> 📌 Version:* ${config.BOT_VERSION}\n*┋ •> ⏱️ Uptime:* ${hours}h ${minutes}m ${seconds}s\n*┋ •> 💬 Prefix:* ${config.isPrefixless ? 'none' : config.currentPrefix}\n*┋ •> 🎨 Font:* ${config.BOT_FONT}\n*┋ •> ✅ Status:* 🟢 ACTIVE\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`;
        
        await sock.sendMessage(chatId, { 
            text: message,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
