// ============================================
// MENU COMMAND - Show bot menu
// Powered by TYREX KSH TECH
// Owner: 255650583044
// ============================================

export default {
    name: 'menu',
    description: 'Show all available bot commands',
    category: 'main',
    alias: ['help', 'commands', 'cmds', 'cmdlist'],
    
    async execute(sock, msg, args, prefix, config) {
        try {
            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || chatId;
            
            // Bot information
            const botName = "༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒";
            const version = "2.0.0";
            const ownerNumber = "255650583044";
            
            // Get commands from config
            const commandsMap = config.commands || new Map();
            
            // Organize commands by category
            const cmdCategories = {
                owner: [],
                admin: [],
                main: [],
                fun: [],
                downloader: []
            };
            
            // Categorize commands based on their category property
            for (const [cmdName, cmdObj] of commandsMap) {
                const category = cmdObj.category || 'main';
                if (cmdCategories[category]) {
                    cmdCategories[category].push({
                        name: cmdName,
                        desc: cmdObj.description || 'No description'
                    });
                } else {
                    cmdCategories.main.push({
                        name: cmdName,
                        desc: cmdObj.description || 'No description'
                    });
                }
            }
            
            // If no commands found, use default list
            let totalCommands = 0;
            if (commandsMap.size === 0) {
                // Default commands
                cmdCategories.owner = [
                    { name: "bc", desc: "Broadcast message to all chats" },
                    { name: "restart", desc: "Restart bot" },
                    { name: "shutdown", desc: "Stop bot" },
                    { name: "setprefix", desc: "Change bot prefix" }
                ];
                cmdCategories.admin = [
                    { name: "kick", desc: "Remove member from group" },
                    { name: "promote", desc: "Make member admin" },
                    { name: "demote", desc: "Remove admin status" },
                    { name: "mute", desc: "Mute group" },
                    { name: "unmute", desc: "Unmute group" }
                ];
                cmdCategories.main = [
                    { name: "ping2", desc: "Check bot speed" },
                    { name: "owner", desc: "Get owner information" },
                    { name: "menu", desc: "Show this menu" }
                ];
                cmdCategories.fun = [
                    { name: "sticker", desc: "Convert image to sticker" },
                    { name: "quote", desc: "Get random quote" }
                ];
                cmdCategories.downloader = [
                    { name: "ytmp3", desc: "Download YouTube audio" },
                    { name: "ytmp4", desc: "Download YouTube video" }
                ];
            }
            
            // Calculate total commands
            for (const cat in cmdCategories) {
                totalCommands += cmdCategories[cat].length;
            }
            
            // Build menu message
            let menuMessage = `╭┄┄┄🌸🌹 *${botName}* 🌹🌸┄┄┄⊷\n`;
            menuMessage += `┃ 📡 *Version:* ${version}\n`;
            menuMessage += `┃ 👑 *Owner:* ${ownerNumber}\n`;
            menuMessage += `┃ 💬 *Prefix:* ${prefix}\n`;
            menuMessage += `┃\n`;
            
            // Owner commands
            if (cmdCategories.owner.length > 0) {
                menuMessage += `┃ 👑 *OWNER COMMANDS*\n`;
                for (const cmd of cmdCategories.owner) {
                    menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
                }
                menuMessage += `┃\n`;
            }
            
            // Admin commands
            if (cmdCategories.admin.length > 0) {
                menuMessage += `┃ ⚙️ *ADMIN COMMANDS*\n`;
                for (const cmd of cmdCategories.admin) {
                    menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
                }
                menuMessage += `┃\n`;
            }
            
            // Main commands
            if (cmdCategories.main.length > 0) {
                menuMessage += `┃ 📜 *MAIN COMMANDS*\n`;
                for (const cmd of cmdCategories.main) {
                    menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
                }
                menuMessage += `┃\n`;
            }
            
            // Fun commands
            if (cmdCategories.fun.length > 0) {
                menuMessage += `┃ 🎮 *FUN COMMANDS*\n`;
                for (const cmd of cmdCategories.fun) {
                    menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
                }
                menuMessage += `┃\n`;
            }
            
            // Downloader commands
            if (cmdCategories.downloader.length > 0) {
                menuMessage += `┃ 📥 *DOWNLOADER COMMANDS*\n`;
                for (const cmd of cmdCategories.downloader) {
                    menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
                }
                menuMessage += `┃\n`;
            }
            
            // Footer
            menuMessage += `┃ 📊 *Total:* ${totalCommands} commands\n`;
            menuMessage += `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⊷\n`;
            menuMessage += `> ® Powered by Tyrex KSH Tech\n`;
            menuMessage += `> 📢 Channel: https://whatsapp.com/channel/0029VafUeCvRWkqX7TQhVR0P`;
            
            await sock.sendMessage(chatId, {
                text: menuMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363424973782944@newsletter',
                        newsletterName: '༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐓𝐄𝐂𝐇༒',
                        serverMessageId: 143
                    },
                    externalAdReply: {
                        title: `${botName} v${version}`,
                        body: `${totalCommands} Commands Available`,
                        thumbnailUrl: 'https://i.ibb.co/V0x5RCkK/file-00000000b26c720cbac7434c723b3ca4.png',
                        sourceUrl: 'https://whatsapp.com/channel/0029VafUeCvRWkqX7TQhVR0P',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: msg });
            
        } catch (e) {
            console.log("Menu Error:", e);
            await sock.sendMessage(chatId, { 
                text: "❌ Error loading menu: " + e.message 
            }, { quoted: msg });
        }
    }
};
