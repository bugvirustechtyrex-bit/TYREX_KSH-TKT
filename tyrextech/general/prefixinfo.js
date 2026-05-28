// ============================================
// PREFIX INFO COMMAND - Show current prefix
// Powered by SILA TECH
// ============================================

export default {
    name: 'prefixinfo',
    description: 'Show current bot prefix',
    category: 'general',
    alias: ['prefix', 'getprefix'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const currentPrefix = config.getCurrentPrefix ? config.getCurrentPrefix() : prefix;
        const isPrefixless = config.isPrefixless || false;
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ PREFIX INFO ⊱┄┄┄◈*\n\n*┋ •> 💬 Current Prefix:* ${isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`}\n*┋ •> 🔓 Prefixless Mode:* ${isPrefixless ? '✅ ENABLED' : '❌ DISABLED'}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${currentPrefix}ping - Test bot\n*┋ •> ${currentPrefix}help - Show menu\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
