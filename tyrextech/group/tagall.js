// ============================================
// TAGALL COMMAND - Mention all group members
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'tagall',
    description: 'Mention all group members',
    category: 'group',
    alias: ['everyone', 'all'],
    
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
            await sock.sendMessage(chatId, { text: "❌ Only admins can use tagall!" }, { quoted: msg });
            return;
        }
        
        const message = args.join(' ') || 'Attention everyone!';
        let tagText = `📢 *${message}*\n\n`;
        const mentions = [];
        
        for (const participant of participants) {
            tagText += `┋ @${participant.id.split('@')[0]}\n`;
            mentions.push(participant.id);
        }
        
        tagText += `\n🌺 *Powered by Tyrex_Ksh Tech*`;
        
        await sock.sendMessage(chatId, {
            text: tagText,
            mentions: mentions,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
