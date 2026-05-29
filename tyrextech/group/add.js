// ============================================
// ADD COMMAND - Add member to group
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'add',
    description: 'Add member to group using phone number',
    category: 'group',
    alias: ['inviteuser', 'adduser'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        
        // Check if group
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: "❌ This command is for groups only!",
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Check if admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(p => p.id === sender && p.admin);
        
        if (!isAdmin) {
            await sock.sendMessage(chatId, {
                text: "❌ Only admins can add members!",
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Get number to add
        const number = args[0];
        if (!number) {
            await sock.sendMessage(chatId, {
                text: `📝 *Usage:* ${prefix}add 255xxxxxxxxx\n\nExample: ${prefix}add 255650583044`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Format number
        let formattedNumber = number.replace(/[^0-9]/g, '');
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '255' + formattedNumber.slice(1);
        }
        if (!formattedNumber.endsWith('@s.whatsapp.net')) {
            formattedNumber = formattedNumber + '@s.whatsapp.net';
        }
        
        try {
            await sock.groupParticipantsUpdate(chatId, [formattedNumber], 'add');
            await sock.sendMessage(chatId, {
                text: `✅ *Success!*\n\nAdded ${number} to the group!`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ *Failed to add user!*\n\nError: ${error.message}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
