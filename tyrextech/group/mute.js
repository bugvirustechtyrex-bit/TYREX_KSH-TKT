// ============================================
// CLOSE GROUP - Mute group (admins only can send)
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'close',
    description: 'Mute group - only admins can send',
    category: 'group',
    alias: ['mute', 'lock'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: "❌ This command is for groups only!" }, { quoted: msg });
            return;
        }
        
        // Check if admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && p.admin);
        
        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: "❌ Only admins can close the group!" }, { quoted: msg });
            return;
        }
        
        await sock.groupSettingUpdate(chatId, 'announcement');
        await sock.sendMessage(chatId, {
            text: "🔒 *Group Closed!*\n\nOnly admins can send messages now.",
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
