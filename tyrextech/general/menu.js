// ============================================
// MENU COMMAND - Show bot menu
// Powered by SILA TECH
// ============================================

export default {
    name: 'menu',
    description: 'Show all available commands',
    category: 'general',
    alias: ['help', 'commands', 'cmds'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const botName = config.BOT_NAME || 'SILA SMD';
        const version = config.VERSION || '1.0.0';
        const currentPrefix = config.getCurrentPrefix ? config.getCurrentPrefix() : prefix;
        
        // Get all commands organized by category
        const commands = config.commands || new Map();
        const categories = new Map();
        
        for (const [cmdName, cmd] of commands) {
            if (!categories.has(cmd.category)) {
                categories.set(cmd.category, []);
            }
            categories.get(cmd.category).push({
                name: cmdName,
                description: cmd.description || 'No description',
                alias: cmd.alias || []
            });
        }
        
        // Build menu message
        let menuMessage = `*╭┈┈┄⊰ ${botName} MENU ⊱┄┄┄◈*\n\n`;
        
        // Sort categories
        const categoryOrder = ['owner', 'group', 'general', 'automation', 'downloader', 'fun', 'tools'];
        const sortedCategories = [...categories.keys()].sort((a, b) => {
            const indexA = categoryOrder.indexOf(a.toLowerCase());
            const indexB = categoryOrder.indexOf(b.toLowerCase());
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        
        for (const category of sortedCategories) {
            const cmdList = categories.get(category);
            if (cmdList && cmdList.length > 0) {
                menuMessage += `*┋ •> 📁 ${category.toUpperCase()}*\n`;
                for (const cmd of cmdList) {
                    menuMessage += `*┋ •> ${currentPrefix}${cmd.name}* - ${cmd.description}\n`;
                }
                menuMessage += `*┋*\n`;
            }
        }
        
        // Add footer
        menuMessage += `*┋ •> 💬 Prefix:* ${config.isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`}\n`;
        menuMessage += `*┋ •> 📊 Total:* ${commands.size} commands\n`;
        menuMessage += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n`;
        menuMessage += `> ® 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await sock.sendMessage(chatId, {
            text: menuMessage,
            contextInfo: {
                forwardingScore: 0,
                isForwarded: false,
                externalAdReply: {
                    title: `${botName} v${version}`,
                    body: `${commands.size} Commands Available`,
                    mediaType: 1,
                    thumbnailUrl: 'https://i.ibb.co/XftY01RL/sila-smd.png',
                    sourceUrl: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
                    mediaUrl: 'https://i.ibb.co/XftY01RL/sila-smd.png'
                }
            }
        }, { quoted: msg });
        
        return true;
    }
};
