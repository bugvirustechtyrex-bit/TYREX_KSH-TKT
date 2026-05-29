// ============================================
// DEMOTE COMMAND - Remove admin status
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'demote',
    description: 'Remove admin status from member',
    category: 'group',
    alias: ['removeadmin', 'unadmin'],
    
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
            await sock.sendMessage(chatId, { text: "❌ Only admins can demote members!" }, { quoted: msg });
            return;
        }
        
        // Get user to demote
        let userToDemote = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToDemote = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        
        if (!userToDemote) {
            await sock.sendMessage(chatId, {
                text: `📝 *Usage:* ${prefix}demote @user`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        try {
            await sock.groupParticipantsUpdate(chatId, [userToDemote], 'demote');
            await sock.sendMessage(chatId, {
                text: `✅ *Admin status removed!*`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to demote: ${error.message}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
