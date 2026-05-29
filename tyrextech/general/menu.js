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
            
            // Bot information
            const botName = "༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒";
            const version = "2.0.0";
            const ownerNumber = "255650583044";
            
            // Command list organized by category
            const commands = {
                owner: [
                    { name: "bc", desc: "Broadcast message to all chats" },
                    { name: "restart", desc: "Restart bot" },
                    { name: "shutdown", desc: "Stop bot" },
                    { name: "setprefix", desc: "Change bot prefix" }
                ],
                admin: [
                    { name: "kick", desc: "Remove member from group" },
                    { name: "promote", desc: "Make member admin" },
                    { name: "demote", desc: "Remove admin status" },
                    { name: "mute", desc: "Mute group" },
                    { name: "unmute", desc: "Unmute group" }
                ],
                main: [
                    { name: "ping2", desc: "Check bot speed" },
                    { name: "owner", desc: "Get owner information" },
                    { name: "menu", desc: "Show this menu" }
                ],
                fun: [
                    { name: "sticker", desc: "Convert image to sticker" },
                    { name: "quote", desc: "Get random quote" }
                ],
                downloader: [
                    { name: "ytmp3", desc: "Download YouTube audio" },
                    { name: "ytmp4", desc: "Download YouTube video" }
                ]
            };
            
            // Build menu message - EXACT SAME FORMAT
            let menuMessage = `╭┄┄┄🌸🌹 *${botName}* 🌹🌸┄┄┄⊷
┃ 📡 *Version:* ${version}
┃ 👑 *Owner:* ${ownerNumber}
┃ 💬 *Prefix:* ${prefix}
┃
`;
            
            // Owner commands
            menuMessage += `┃ 👑 *OWNER COMMANDS*\n`;
            for (const cmd of commands.owner) {
                menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
            }
            menuMessage += `┃\n`;
            
            // Admin commands
            menuMessage += `┃ ⚙️ *ADMIN COMMANDS*\n`;
            for (const cmd of commands.admin) {
                menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
            }
            menuMessage += `┃\n`;
            
            // Main commands
            menuMessage += `┃ 📜 *MAIN COMMANDS*\n`;
            for (const cmd of commands.main) {
                menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
            }
            menuMessage += `┃\n`;
            
            // Fun commands
            menuMessage += `┃ 🎮 *FUN COMMANDS*\n`;
            for (const cmd of commands.fun) {
                menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
            }
            menuMessage += `┃\n`;
            
            // Downloader commands
            menuMessage += `┃ 📥 *DOWNLOADER COMMANDS*\n`;
            for (const cmd of commands.downloader) {
                menuMessage += `┃ ├─ ${prefix}${cmd.name} - ${cmd.desc}\n`;
            }
            menuMessage += `┃\n`;
            
            // Footer
            menuMessage += `┃ 📊 *Total:* ${Object.values(commands).flat().length} commands
╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⊷
> ® Powered by Tyrex KSH Tech
> 📢 Join: https://whatsapp.com/channel/0029VbCnY1l7j6gG5sjhUL42`;
            
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
                        body: `${Object.values(commands).flat().length} Commands Available`,
                        thumbnailUrl: 'https://i.ibb.co/V0x5RCkK/file-00000000b26c720cbac7434c723b3ca4.png',
                        sourceUrl: 'https://chat.whatsapp.com/GIDYUiVD8D1D1MVD5RrVLE',
                        mediaType: 1
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
