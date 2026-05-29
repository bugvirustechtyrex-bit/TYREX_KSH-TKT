// ============================================
// MENU COMMAND - Show bot menu
// Powered by Tyrex KSH Tech
// ============================================

export default {
    name: 'menu',
    description: 'Show all available bot commands',
    category: 'general',
    alias: ['help', 'commands', 'cmds', 'cmdlist'],
    
    async execute(sock, msg, args, prefix, config) {
        try {
            const chatId = msg.key.remoteJid;
            
            // Get current date and time
            const now = new Date();
            const date = now.toLocaleDateString('en-GB');
            const time = now.toLocaleTimeString('en-GB');
            
            // Bot information
            const botName = "༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒";
            const ownerName = "𝐓𝐘𝐑𝐄𝐗 𝐊𝐒𝐇 𝐓𝐄𝐂𝐇";
            const version = "2.0.0";
            const mode = "PUBLIC";
            const ram = "35.5MB/512MB";
            const ping = `${Date.now() - msg.messageTimestamp * 1000}ms`;
            const uptime = formatUptime(process.uptime());
            const totalCommands = 114;
            const status = "ONLINE";
            
            // Command lists by category
            const commands = {
                owner: ["ping", "style", "p", "speed", "setprefix", "prefixset", "changeprefix", "setavatar", "avatar", "changeavatar", "setimage", "setthumb", "setfont", "font", "changefont", "setstyle", "setname", "botname", "changename", "setbotname"],
                group: ["add", "invite", "antidemote", "autojoin", "autoadd", "join", "ban", "kick", "remove", "promote", "demote", "tagall", "hidetag"],
                downloader: ["ytmp3", "ytmp4", "ytaudio", "ytvideo", "ig", "instagram", "fb", "facebook", "tiktok", "tt", "twitter", "tw", "mediafire", "gdrive"],
                converter: ["toaudio", "tovideo", "sticker", "s", "img2sticker", "mp3", "mp4", "tourl", "upload", "imgtourl"],
                fun: ["meme", "joke", "quotes", "fact", "truth", "dare", "simp", "hack", "ppcouple", "wallpaper"],
                tools: ["calc", "calculator", "weather", "qrcode", "qr", "readqr", "shorturl", "tinyurl", "translate", "tr", "tts"],
                ai: ["gpt", "ai", "chatgpt", "bing", "bard", "gemini", "blackbox", "openai", "imagine", "dalle"],
                general: ["alive", "status", "alive2", "status2", "botinfo2", "ese", "fonttest", "testfont", "convert", "sila", "ese2", "styles", "showfonts", "menu", "help", "commands", "cmds", "ping2", "p2", "pong2", "prefixinfo", "prefix", "getprefix", "uptime", "runtime", "up"]
            };
            
            // Build main header
            let menuMessage = `╭┄┄┄🌸🌹 ${botName} 🌹🌸┄┄┄⊷\n`;
            menuMessage += `┃◆┬┄★ ★ ★ ★ ★ ★ ★ ★\n`;
            menuMessage += `┃◆┊ 🤖 ʙᴏᴛ: ${botName}\n`;
            menuMessage += `┃◆┊ 👤 ᴏᴡɴᴇʀ: ${ownerName}\n`;
            menuMessage += `┃◆┊ 📅 ᴅᴀᴛᴇ: ${date}\n`;
            menuMessage += `┃◆┊ ⏰ ᴛɪᴍᴇ: ${time}\n`;
            menuMessage += `┃◆┊ ⚡ ᴘʀᴇғɪx: ${prefix}\n`;
            menuMessage += `┃◆┊ 🎮 ᴍᴏᴅᴇ: ${mode}\n`;
            menuMessage += `┃◆┊ 💾 ʀᴀᴍ: ${ram}\n`;
            menuMessage += `┃◆┊ 📡 ᴘɪɴɢ: ${ping}\n`;
            menuMessage += `┃◆┊ 🕐 ᴜᴘᴛɪᴍᴇ: ${uptime}\n`;
            menuMessage += `┃◆┊ 📊 ᴄᴏᴍᴍᴀɴᴅs: ${totalCommands}\n`;
            menuMessage += `┃◆┊ 🌐 sᴛᴀᴛᴜs: ${status}\n`;
            menuMessage += `┃◆┴┄★ ★ ★ ★ ★ ★ ★ ★\n`;
            menuMessage += `╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈⊷\n\n`;
            
            // Owner commands
            menuMessage += `╭┈┈┄🌸🌹 OWNER 🌹🌸┄┄┄◈\n`;
            for (const cmd of commands.owner) {
                menuMessage += `┋▸ .${cmd}\n`;
            }
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
            
            // Group commands
            menuMessage += `╭┈┈┄🌸🌹 GROUP 🌹🌸┄┄┄◈\n`;
            for (const cmd of commands.group) {
                menuMessage += `┋▸ .${cmd}\n`;
            }
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
            
            // Downloader commands
            menuMessage += `╭┈┈┄🌸🌹 DOWNLOADER 🌹🌸┄┄┄◈\n`;
            for (const cmd of commands.downloader) {
                menuMessage += `┋▸ .${cmd}\n`;
            }
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
            
            // Converter commands
            menuMessage += `╭┈┈┄🌸🌹 CONVERTER 🌹🌸┄┄┄◈\n`;
            for (const cmd of commands.converter) {
                menuMessage += `┋▸ .${cmd}\n`;
            }
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
            
            // Fun commands
            menuMessage += `╭┈┈┄🌸🌹 FUN 🌹🌸┄┄┄◈\n`;
            for (const cmd of commands.fun) {
                menuMessage += `┋▸ .${cmd}\n`;
            }
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
            
            // Tools commands
            menuMessage += `╭┈┈┄🌸🌹 TOOLS 🌹🌸┄┄┄◈\n`;
            for (const cmd of commands.tools) {
                menuMessage += `┋▸ .${cmd}\n`;
            }
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
            
            // AI commands
            menuMessage += `╭┈┈┄🌸🌹 AI 🌹🌸┄┄┄◈\n`;
            for (const cmd of commands.ai) {
                menuMessage += `┋▸ .${cmd}\n`;
            }
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n`;
            
            // General commands
            menuMessage += `╭┈┈┄🌸🌹 GENERAL 🌹🌸┄┄┄◈\n`;
            for (const cmd of commands.general) {
                menuMessage += `┋▸ .${cmd}\n`;
            }
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄◈\n\n`;
            
            // Footer
            menuMessage += `╭┄┄┄🌸🌹 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 🌹🌸┄┄┄⊷\n`;
            menuMessage += `┋◆> ${botName}\n`;
            menuMessage += `╰┄┄┄┄┄┈┈┈┈┄┄┄⊷\n\n`;
            menuMessage += `> ® ${botName}`;
            
            await sock.sendMessage(chatId, {
                text: menuMessage,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            
        } catch (e) {
            console.log("Menu Error:", e);
            await sock.sendMessage(chatId, { 
                text: "❌ Error loading menu: " + e.message 
            }, { quoted: msg });
        }
    }
};

// Helper function to format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}
