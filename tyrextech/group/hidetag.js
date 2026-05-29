// ============================================
// HIDETAG - Tag all members hidden
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'hidetag',
    description: 'Tag all members with hidden message',
    category: 'group',
    alias: ['htag', 'silenttag'],
    
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
            await sock.sendMessage(chatId, { text: "❌ Only admins can use hidetag!" }, { quoted: msg });
            return;
        }
        
        const message = args.join(' ') || 'Message from admin';
        const mentions = participants.map(p => p.id);
        
        await sock.sendMessage(chatId, {
            text: `📢 *${message}*`,
            mentions: mentions,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
