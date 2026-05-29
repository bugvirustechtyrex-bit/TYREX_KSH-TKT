// ============================================
// DEMOTE COMMAND - Remove admin status (Reply or Mention)
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'demote',
    description: 'Remove admin status (reply to their message or mention)',
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
                    text: "❌ Only admins can demote members!" 
                }, { quoted: msg });
                return;
            }
            
            // Get user to demote - PRIORITY: REPLY > MENTION > ARGUMENT
            let userToDemote = null;
            
            // 1. Check if replying to a message
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                userToDemote = msg.message.extendedTextMessage.contextInfo.participant;
            }
            // 2. Check if mentioned someone
            else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                userToDemote = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }
            // 3. Check if number provided in args
            else if (args[0]) {
                let number = args[0].replace(/[^0-9]/g, '');
                if (number.startsWith('0')) number = '255' + number.slice(1);
                if (number.startsWith('255')) number = number + '@s.whatsapp.net';
                userToDemote = number;
            }
            
            if (!userToDemote) {
                await sock.sendMessage(chatId, {
                    text: `📝 *How to use:*\n\n1️⃣ *Reply* to user's message:\n   ${prefix}demote\n\n2️⃣ *Mention* the user:\n   ${prefix}demote @username\n\n3️⃣ *Phone number:*\n   ${prefix}demote 255xxxxxxxxx\n\n🌺 *Powered by Tyrex_Ksh Tech*`,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Check if user is in group
            const targetParticipant = participants.find(p => p.id === userToDemote);
            if (!targetParticipant) {
                await sock.sendMessage(chatId, {
                    text: `❌ User is not in this group!`,
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
                text: `❌ *Failed to demote user!*\n\nError: ${error.message}\n\n🌺 *Powered by Tyrex_Ksh Tech*`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
