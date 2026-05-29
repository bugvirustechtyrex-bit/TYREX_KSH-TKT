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
            await sock.sendMessage(chatId, { 
                text: "❌ This command is for groups only!" 
            }, { quoted: msg });
            return;
        }
        
        try {
            // Get group metadata
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;
            
            // Find sender in participants
            const senderParticipant = participants.find(p => p.id === sender);
            
            // Check if sender is admin
            const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
            
            if (!isAdmin) {
                await sock.sendMessage(chatId, { 
                    text: "❌ Only admins can demote members!\n\n*Note:* Make sure the bot is also an admin in this group." 
                }, { quoted: msg });
                return;
            }
            
            // Get user to demote
            let userToDemote = null;
            
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                userToDemote = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                userToDemote = msg.message.extendedTextMessage.contextInfo.participant;
            }
            
            if (!userToDemote) {
                await sock.sendMessage(chatId, {
                    text: `📝 *Usage:* ${prefix}demote @user\n\nExample: ${prefix}demote @username`,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Demote user
            await sock.groupParticipantsUpdate(chatId, [userToDemote], 'demote');
            
            await sock.sendMessage(chatId, {
                text: `✅ *Successfully Demoted!*\n\n👤 @${userToDemote.split('@')[0]} is no longer an admin!\n\n🌺 *Powered by Tyrex_Ksh Tech*`,
                mentions: [userToDemote],
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            
        } catch (error) {
            console.error("Demote error:", error);
            await sock.sendMessage(chatId, {
                text: `❌ *Failed to demote user!*\n\nError: ${error.message}\n\n*Requirements:*\n• Bot must be admin\n• User must be admin currently`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
