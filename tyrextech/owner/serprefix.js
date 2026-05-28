// ============================================
// SETPREFIX COMMAND - Change bot prefix
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'setprefix',
    description: 'Change bot prefix',
    category: 'owner',
    alias: ['prefixset', 'changeprefix'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ SET PREFIX ⊱┄┄┄◈*\n\n*┋ •> Current Prefix:* ${config.isPrefixless ? 'none (prefixless)' : `"${prefix}"`}\n*┋*\n*┋ •> Usage:* ${prefix}setprefix <new_prefix>\n*┋ •> Example:* ${prefix}setprefix !\n*┋ •> ${prefix}setprefix none - Disable prefix\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        const newPrefix = args[0].toLowerCase();
        const result = config.updatePrefixImmediately(newPrefix, config.prefixManager);
        
        if (result.success) {
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ PREFIX CHANGED ⊱┄┄┄◈*\n\n*┋ •> Old Prefix:* ${result.oldPrefix === 'none' ? 'none' : `"${result.oldPrefix}"`}\n*┋ •> New Prefix:* ${result.newPrefix === 'none' ? 'none (prefixless)' : `"${result.newPrefix}"`}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { 
                text: `❌ *Error:* ${result.error}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
