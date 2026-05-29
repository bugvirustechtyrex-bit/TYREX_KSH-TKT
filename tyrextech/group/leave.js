// ============================================
// LEAVE COMMAND - Bot leaves group
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'leave',
    description: 'Bot leaves the group',
    category: 'group',
    alias: ['exit', 'left'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: "❌ This command is for groups only!" }, { quoted: msg });
            return;
        }
        
        // Check if admin or owner
        const ownerNumber = "255650583044";
        const isOwner = sender.includes(ownerNumber);
        
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && p.admin);
        
        if (!isAdmin && !isOwner) {
            await sock.sendMessage(chatId, { text: "❌ Only admins or owner can make bot leave!" }, { quoted: msg });
            return;
        }
        
        await sock.sendMessage(chatId, {
            text: "👋 *Goodbye!* Bot is leaving this group.",
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
        
        await sock.groupLeave(chatId);
    }
};
