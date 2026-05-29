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
            
            // Check if sender is admin (superadmin or admin)
            const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
            
            if (!isAdmin) {
                await sock.sendMessage(chatId, { 
                    text: "❌ Only admins can promote members!\n\n*Note:* Make sure the bot is also an admin in this group." 
                }, { quoted: msg });
                return;
            }
            
            // Get user to promote (reply or mention)
            let userToPromote = null;
            
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                userToPromote = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                userToPromote = msg.message.extendedTextMessage.contextInfo.participant;
            }
            
            if (!userToPromote) {
                await sock.sendMessage(chatId, {
                    text: `📝 *Usage:* ${prefix}promote @user\n\nExample: ${prefix}promote @username\nOr reply to a user's message with ${prefix}promote`,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Check if user is already admin
            const targetParticipant = participants.find(p => p.id === userToPromote);
            if (targetParticipant && (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin')) {
                await sock.sendMessage(chatId, {
                    text: `❌ That user is already an admin!`,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Promote user
            await sock.groupParticipantsUpdate(chatId, [userToPromote], 'promote');
            
            // Get username
            let username = userToPromote.split('@')[0];
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                // Try to get push name
                const userJid = userToPromote;
                const userContact = await sock.onWhatsApp(userJid);
                if (userContact[0]?.exists) {
                    // You might need to store names or use other method
                }
            }
            
            await sock.sendMessage(chatId, {
                text: `✅ *Successfully Promoted!*\n\n👤 @${userToPromote.split('@')[0]} is now an admin!\n\n🌺 *Powered by Tyrex_Ksh Tech*`,
                mentions: [userToPromote],
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            
        } catch (error) {
            console.error("Promote error:", error);
            await sock.sendMessage(chatId, {
                text: `❌ *Failed to promote user!*\n\nError: ${error.message}\n\n*Requirements:*\n• Bot must be admin\n• User must be in the group`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
