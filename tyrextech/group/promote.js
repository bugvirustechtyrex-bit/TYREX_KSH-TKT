// ============================================
// PROMOTE COMMAND - Make member admin (Reply or Mention)
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'promote',
    description: 'Make a member admin (reply to their message or mention)',
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
            
            // Check if sender is admin
            const isAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin');
            
            if (!isAdmin) {
                await sock.sendMessage(chatId, { 
                    text: "❌ Only admins can promote members!\n\n*Note:* Make sure you are an admin in this group." 
                }, { quoted: msg });
                return;
            }
            
            // Get user to promote - PRIORITY: REPLY > MENTION > ARGUMENT
            let userToPromote = null;
            
            // 1. Check if replying to a message
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                userToPromote = msg.message.extendedTextMessage.contextInfo.participant;
            }
            // 2. Check if mentioned someone
            else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                userToPromote = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // 3. Check if number provided in args
            else if (args[0]) {
                let number = args[0].replace(/[^0-9]/g, '');
                if (number.startsWith('0')) number = '255' + number.slice(1);
                if (number.startsWith('255')) number = number + '@s.whatsapp.net';
                userToPromote = number;
            }
            
            if (!userToPromote) {
                await sock.sendMessage(chatId, {
                    text: `📝 *How to use:*\n\n1️⃣ *Reply* to user's message:\n   ${prefix}promote\n\n2️⃣ *Mention* the user:\n   ${prefix}promote @username\n\n3️⃣ *Phone number:*\n   ${prefix}promote 255xxxxxxxxx\n\n🌺 *Powered by Tyrex_Ksh Tech*`,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Check if user is in group
            const targetParticipant = participants.find(p => p.id === userToPromote);
            if (!targetParticipant) {
                await sock.sendMessage(chatId, {
                    text: `❌ User is not in this group!`,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Check if user is already admin
            if (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin') {
                await sock.sendMessage(chatId, {
                    text: `❌ @${userToPromote.split('@')[0]} is already an admin!`,
                    mentions: [userToPromote],
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Promote user
            await sock.groupParticipantsUpdate(chatId, [userToPromote], 'promote');
            
            // Send success message
            const successText = `✅ *Successfully Promoted!*\n\n👑 @${userToPromote.split('@')[0]} is now an admin!\n\n🌺 *Powered by Tyrex_Ksh Tech*`;
            
            await sock.sendMessage(chatId, {
                text: successText,
                mentions: [userToPromote],
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            
        } catch (error) {
            console.error("Promote error:", error);
            let errorMsg = "❌ *Failed to promote user!*\n\n";
            
            if (error.message.includes('not an admin')) {
                errorMsg += "⚠️ *Bot is not an admin!*\nPlease make the bot an admin first.";
            } else if (error.message.includes('403')) {
                errorMsg += "⚠️ *Permission denied!*\nMake sure bot has admin privileges.";
            } else {
                errorMsg += `Error: ${error.message}`;
            }
            
            errorMsg += `\n\n🌺 *Powered by Tyrex_Ksh Tech*`;
            
            await sock.sendMessage(chatId, {
                text: errorMsg,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
