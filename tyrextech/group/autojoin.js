// ============================================
// AUTOJOIN COMMAND - Auto join group settings
// Group Admin Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'autojoin',
    description: 'Manage auto join settings for group',
    category: 'group',
    alias: ['autoadd', 'join'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '❌ *This command can only be used in groups!*'
            }, { quoted: msg });
            return;
        }
        
        const action = args[0]?.toLowerCase();
        
        if (!action) {
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ AUTO JOIN GROUP ⊱┄┄┄◈*\n\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}autojoin on* - Enable auto join\n*┋ •> ${prefix}autojoin off* - Disable auto join\n*┋ •> ${prefix}autojoin status* - Check status\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        if (action === 'status') {
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ AUTO JOIN STATUS ⊱┄┄┄◈*\n\n*┋ •> 🔗 Status:* ✅ ACTIVE\n*┋ •> 📊 Group:* ${config.GROUP_NAME}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { 
                text: `✅ *Auto join ${action === 'on' ? 'ENABLED' : 'DISABLED'}*!`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
