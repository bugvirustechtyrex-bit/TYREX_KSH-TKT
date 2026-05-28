// ============================================
// UPTIME COMMAND - Show bot uptime
// Powered by SILA TECH
// ============================================

export default {
    name: 'uptime',
    description: 'Show bot uptime and memory usage',
    category: 'general',
    alias: ['runtime', 'up'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const rss = Math.round(memoryUsage.rss / 1024 / 1024);
        const heapTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const heapUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ UPTIME INFO ⊱┄┄┄◈*\n\n*┋ •> ⏱️ Uptime:* ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s\n*┋ •> 💾 Memory RSS:* ${rss} MB\n*┋ •> 📦 Heap Total:* ${heapTotal} MB\n*┋ •> 📝 Heap Used:* ${heapUsed} MB\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
