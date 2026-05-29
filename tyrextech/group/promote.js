// ============================================
// PROMOTE COMMAND - Make member admin
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'promote',
    description: 'Make a member admin',
    category: 'group',
    alias: ['makeadmin', 'setadmin'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: "❌ This command is for groups only!" }, { quoted: msg });
            return;
        }
        
        // Check if admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(p => p.id === sender && p.admin === 'admin');
        
        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: "❌ Only admins can promote members!" }, { quoted: msg });
            return;
        }
        
        // Get user to promote
        let userToPromote = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToPromote = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        
        if (!userToPromote) {
            await sock.sendMessage(chatId, {
                text: `📝 *Usage:* ${prefix}promote @user`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        try {
            await sock.groupParticipantsUpdate(chatId, [userToPromote], 'promote');
            await sock.sendMessage(chatId, {
                text: `✅ *Promoted to admin!*`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to promote: ${error.message}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
