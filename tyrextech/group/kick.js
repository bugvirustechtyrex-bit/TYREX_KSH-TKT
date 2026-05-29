// ============================================
// KICK COMMAND - Remove member from group
// Supports: .kick @user OR reply to message
// Powered by Tyrex KSH Tech
// ============================================

export default {
    name: 'kick',
    description: 'Remove a member from the group',
    category: 'group',
    alias: ['remove', 'rm'],
    
    async execute(sock, msg, args, prefix, config) {
        try {
            const chatId = msg.key.remoteJid;
            
            // Check if it's a group
            if (!chatId.endsWith('@g.us')) {
                await sock.sendMessage(chatId, { 
                    text: '❌ This command can only be used in groups!' 
                }, { quoted: msg });
                return;
            }
            
            // Get group metadata to check if bot is admin
            const groupMetadata = await sock.groupMetadata(chatId);
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            
            // Check if bot is admin
            const botIsAdmin = groupMetadata.participants.some(
                p => p.id === botNumber && p.admin === 'admin'
            );
            
            if (!botIsAdmin) {
                await sock.sendMessage(chatId, { 
                    text: '❌ I need to be an admin to kick members!' 
                }, { quoted: msg });
                return;
            }
            
            // Get sender info
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderIsAdmin = groupMetadata.participants.some(
                p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
            );
            
            if (!senderIsAdmin) {
                await sock.sendMessage(chatId, { 
                    text: '❌ Only admins can kick members!' 
                }, { quoted: msg });
                return;
            }
            
            let usersToKick = [];
            
            // METHOD 1: Check if replying to a message
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMsg = msg.message.extendedTextMessage.contextInfo;
                const quotedParticipant = quotedMsg.participant;
                const quotedSender = quotedMsg.remoteJid;
                
                if (quotedParticipant) {
                    usersToKick.push(quotedParticipant);
                } else if (quotedSender && quotedSender !== chatId) {
                    usersToKick.push(quotedSender);
                }
            }
            
            // METHOD 2: Check for mentioned users
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                const mentions = msg.message.extendedTextMessage.contextInfo.mentionedJid;
                usersToKick.push(...mentions);
            }
            
            // METHOD 3: Check if user provided a number in args
            if (args.length > 0 && usersToKick.length === 0) {
                const input = args[0].replace(/[^0-9]/g, '');
                if (input.length >= 10) {
                    const jid = input + '@s.whatsapp.net';
                    usersToKick.push(jid);
                }
            }
            
            // Remove duplicates
            usersToKick = [...new Set(usersToKick)];
            
            // Validate
            if (usersToKick.length === 0) {
                await sock.sendMessage(chatId, { 
                    text: `📝 *Usage:* ${prefix}kick @user\nOr reply to a message with ${prefix}kick`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Don't kick bot or owner
            const ownerNumber = config.OWNER_NUMBER + '@s.whatsapp.net';
            let kicked = [];
            let failed = [];
            
            for (const user of usersToKick) {
                // Skip if trying to kick bot
                if (user === botNumber) {
                    failed.push(`${user.split('@')[0]} (Cannot kick bot)`);
                    continue;
                }
                
                // Skip if trying to kick owner
                if (user === ownerNumber) {
                    failed.push(`${user.split('@')[0]} (Cannot kick owner)`);
                    continue;
                }
                
                // Check if user is admin
                const userIsAdmin = groupMetadata.participants.some(
                    p => p.id === user && (p.admin === 'admin' || p.admin === 'superadmin')
                );
                
                if (userIsAdmin) {
                    failed.push(`${user.split('@')[0]} (Admin cannot be kicked)`);
                    continue;
                }
                
                try {
                    await sock.groupParticipantsUpdate(chatId, [user], 'remove');
                    kicked.push(user.split('@')[0]);
                } catch (error) {
                    failed.push(`${user.split('@')[0]} (${error.message})`);
                }
            }
            
            // Create result message
            let resultMsg = '━━━━━━━━━━━━━━━━━━\n';
            resultMsg += '     👢 *KICK RESULTS* 👢\n';
            resultMsg += '━━━━━━━━━━━━━━━━━━\n\n';
            
            if (kicked.length > 0) {
                resultMsg += '✅ *Successfully Kicked:*\n';
                kicked.forEach(user => {
                    resultMsg += `┋▸ @${user}\n`;
                });
                resultMsg += '\n';
            }
            
            if (failed.length > 0) {
                resultMsg += '❌ *Failed to Kick:*\n';
                failed.forEach(user => {
                    resultMsg += `┋▸ ${user}\n`;
                });
            }
            
            if (kicked.length === 0 && failed.length === 0) {
                resultMsg = '❌ No users were kicked. Please tag or reply to a user.';
                await sock.sendMessage(chatId, { text: resultMsg }, { quoted: msg });
            } else {
                const mentions = kicked.map(user => user + '@s.whatsapp.net');
                await sock.sendMessage(chatId, { 
                    text: resultMsg,
                    mentions: mentions
                }, { quoted: msg });
            }
            
        } catch (error) {
            console.error('Kick command error:', error);
            await sock.sendMessage(msg.key.remoteJid, { 
                text: '❌ Error: ' + error.message 
            }, { quoted: msg });
        }
    }
};
