// ============================================
// SETAVATAR COMMAND - Change bot avatar URL
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'setavatar',
    description: 'Change bot avatar/image URL',
    category: 'owner',
    alias: ['avatar', 'changeavatar', 'setimage', 'setthumb'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ SET AVATAR ⊱┄┄┄◈*\n\n*┋ •> 🖼️ Current Avatar URL:* ${config.BOT_AVATAR_URL}\n*┋*\n*┋ •> 📋 Usage:* ${prefix}setavatar <image_url>\n*┋ •> Example:* ${prefix}setavatar https://i.ibb.co/XftY01RL/sila-smd.png\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        const newAvatarUrl = args[0];
        
        // Validate URL
        if (!newAvatarUrl.startsWith('http://') && !newAvatarUrl.startsWith('https://')) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Invalid URL!*\n\nPlease provide a valid image URL starting with http:// or https://`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Update using config.updateConfig
        if (config.updateConfig) {
            config.updateConfig('BOT_AVATAR_URL', newAvatarUrl);
            config.updateConfig('BOT_THUMBNAIL_URL', newAvatarUrl);
        }
        
        // Update process.env for compatibility
        process.env.BOT_AVATAR_URL = newAvatarUrl;
        process.env.BOT_THUMBNAIL_URL = newAvatarUrl;
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ AVATAR UPDATED ⊱┄┄┄◈*\n\n*┋ •> 🖼️ New Avatar URL:* ${newAvatarUrl}\n*┋*\n*┋ •> ✅ Avatar updated successfully!*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
