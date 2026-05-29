// ============================================
// KICK COMMAND - Remove member from group
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'kick',
    description: 'Remove member from group',
    category: 'group',
    alias: ['remove', 'rm'],
    
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
        const isAdmin = participants.some(p => p.id === sender && p.admin);
        
        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: "❌ Only admins can kick members!" }, { quoted: msg });
            return;
        }
        
        // Get user to kick (reply or mention)
        let userToKick = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            userToKick = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');
            if (number.startsWith('0')) number = '255' + number.slice(1);
            userToKick = number + '@s.whatsapp.net';
        }
        
        if (!userToKick) {
            await sock.sendMessage(chatId, {
                text: `📝 *Usage:* ${prefix}kick @user\nOr reply to a message with ${prefix}kick`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        try {
            await sock.groupParticipantsUpdate(chatId, [userToKick], 'remove');
            await sock.sendMessage(chatId, {
                text: `✅ *Removed from group!*`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Failed to kick user: ${error.message}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
