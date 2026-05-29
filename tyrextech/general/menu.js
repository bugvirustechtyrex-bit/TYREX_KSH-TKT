// ============================================
// MENU COMMAND - Display bot menu with style
// Powered by Tyrex_Ksh Tech
// ============================================

export default {
    name: 'menu',
    description: 'Display bot menu with all commands',
    category: 'general',
    alias: ['m', 'allmenu', 'cmdlist', 'menulist'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const commands = config.commands || new Map();
        
        // Collect commands by category
        const categories = new Map();
        
        for (const [cmdName, cmdObj] of commands) {
            const category = cmdObj.category || 'general';
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category).push(cmdName);
        }
        
        // Header ya menu
        let menuText = `🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸\n`;
        menuText += `   *𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃 𝐌𝐄𝐍𝐔*\n`;
        menuText += `🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸\n\n`;
        
        menuText += `┌─⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷⊷\n`;
        menuText += `│  ✨ *BOT INFORMATION* ✨\n`;
        menuText += `├───────────────────────\n`;
        menuText += `│  🤖 *Name:* ${config.BOT_NAME || 'TYREX_KSH MD'}\n`;
        menuText += `│  📌 *Version:* ${config.BOT_VERSION || '1.0.0'}\n`;
        menuText += `│  💬 *Prefix:* ${config.isPrefixless ? 'none' : prefix}\n`;
        menuText += `│  📊 *Total Commands:* ${commands.size}\n`;
        menuText += `│  ⏱️ *Uptime:* ${formatUptime(process.uptime())}\n`;
        menuText += `└───────────────────────\n\n`;
        
        // Categories na commands zao
        for (const [category, cmdList] of categories) {
            menuText += `┌─⊷⊷⊷⊷ *${getCategoryEmoji(category)} ${category.toUpperCase()}* ⊷⊷⊷⊷\n`;
            menuText += `├───────────────────────\n`;
            
            for (const cmd of cmdList) {
                const cmdObj = commands.get(cmd);
                const desc = cmdObj?.description || 'No description';
                menuText += `│  ${prefix}${cmd}\n`;
                menuText += `│  ↳ ${desc.substring(0, 40)}\n`;
                menuText += `│\n`;
            }
            menuText += `└───────────────────────\n\n`;
        }
        
        // Footer
        menuText += `🌺🌺🌺🌺🌺🌺🌺🌺🌺🌺🌺🌺🌺\n`;
        menuText += `   *𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐓𝐲𝐫𝐞𝐱_𝐊𝐬𝐡 𝐓𝐞𝐜𝐡*\n`;
        menuText += `🌺🌺🌺🌺🌺🌺🌺🌺🌺🌺🌺🌺🌺\n`;
        
        await sock.sendMessage(chatId, { 
            text: menuText,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};

// Helper functions
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function getCategoryEmoji(category) {
    const emojis = {
        'general': '📋',
        'admin': '👑',
        'owner': '👤',
        'group': '👥',
        'download': '⬇️',
        'search': '🔍',
        'fun': '🎮',
        'nsfw': '🔞',
        'ai': '🧠',
        'tools': '🛠️'
    };
    return emojis[category.toLowerCase()] || '📁';
}
