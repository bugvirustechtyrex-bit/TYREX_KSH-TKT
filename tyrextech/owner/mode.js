// ============================================
// MODE COMMAND - Change bot mode (Public/Private)
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'mode',
    description: 'Change bot mode (Public/Private)',
    category: 'owner',
    alias: ['setmode', 'botmode', 'changemode'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        
        // Check if sender is owner
        const ownerNumber = "255650583044";
        const isOwner = sender.includes(ownerNumber) || sender === ownerNumber;
        
        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: "❌ *Access Denied!*\n\nThis command is only for the bot owner!",
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Get mode from args
        const newMode = args[0]?.toLowerCase();
        
        if (!newMode || (newMode !== 'public' && newMode !== 'private')) {
            const currentMode = config.BOT_MODE || 'PUBLIC';
            await sock.sendMessage(chatId, {
                text: `🌸 *MODE COMMAND* 🌸\n\n` +
                      `📊 *Current Mode:* ${currentMode.toUpperCase()}\n\n` +
                      `📝 *Usage:*\n` +
                      `${prefix}mode public - Everyone can use bot\n` +
                      `${prefix}mode private - Only owner can use bot\n\n` +
                      `🌺 *Powered by Tyrex_Ksh Tech*`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Update mode
        const oldMode = config.BOT_MODE || 'PUBLIC';
        config.BOT_MODE = newMode.toUpperCase();
        
        let statusText = '';
        if (newMode === 'public') {
            statusText = '🌐 *PUBLIC MODE* 🌐\n\nAnyone can use the bot commands!';
        } else {
            statusText = '🔒 *PRIVATE MODE* 🔒\n\nOnly owner can use the bot commands!';
        }
        
        await sock.sendMessage(chatId, {
            text: `✅ *Mode Changed Successfully!*\n\n` +
                  `📌 *Old Mode:* ${oldMode}\n` +
                  `📌 *New Mode:* ${newMode.toUpperCase()}\n\n` +
                  `${statusText}\n\n` +
                  `🌺 *Powered by Tyrex_Ksh Tech*`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
