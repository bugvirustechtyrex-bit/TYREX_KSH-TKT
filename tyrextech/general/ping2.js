// ============================================
// PING COMMAND - Check if bot is alive
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'ping2',
    description: 'Check if bot is alive and running',
    category: 'general',
    alias: ['p2', 'pong2'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const start = Date.now();
        
        await sock.sendMessage(chatId, { 
            text: `🌸🫵 Pong! ${Date.now() - start}ms 🌷\n\n🌺 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐓𝐲𝐫𝐞𝐱_𝐊𝐬𝐡 𝐓𝐞𝐜𝐡 🌺`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
