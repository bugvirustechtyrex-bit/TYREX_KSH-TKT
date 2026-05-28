// ============================================
// ALIVE2 COMMAND - Bot status with custom font
// All messages use selected bot font
// Powered by SILA TECH
// ============================================

export default {
    name: 'alive2',
    description: 'Check bot status with custom font styling',
    category: 'general',
    alias: ['status2', 'botinfo2'],
    
    async execute(sock, msg, args, prefix, config) {
        // Safely get chat ID
        let chatId = 'status@broadcast';
        try {
            chatId = msg.key?.remoteJid || 'status@broadcast';
        } catch (e) {
            chatId = 'status@broadcast';
        }
        
        // Get current font safely
        const currentFont = (config.BOT_FONT || 'bold').toString();
        
        // Safe apply font function
        const safeApplyFont = (text, font) => {
            try {
                return config.applyFont(text, font);
            } catch (e) {
                return text;
            }
        };
        
        // Bot Name with font
        const botName = safeApplyFont(config.BOT_NAME || 'SILA SMD', currentFont);
        const version = safeApplyFont(`v${config.BOT_VERSION || '1.0.0'}`, currentFont);
        
        // Get uptime
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeText = safeApplyFont(`${hours}h ${minutes}m ${seconds}s`, currentFont);
        
        // Get memory usage
        const memoryUsage = process.memoryUsage();
        const rss = Math.round(memoryUsage.rss / 1024 / 1024);
        const heapUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const heapTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        const memoryText = safeApplyFont(`${rss} MB (RSS) | ${heapUsed}/${heapTotal} MB`, currentFont);
        
        // Get platform
        let platform = 'Local/VPS';
        if (process.env.DYNO) platform = 'Heroku';
        else if (process.env.PANEL) platform = 'Panel';
        else if (process.env.RENDER) platform = 'Render';
        else if (process.env.REPLIT) platform = 'Replit';
        const platformText = safeApplyFont(platform, currentFont);
        
        // Get bot mode
        let botMode = 'public';
        try {
            if (config.botModeManager) {
                botMode = config.botModeManager.getMode();
            }
        } catch (e) {}
        const modeText = safeApplyFont(botMode.toUpperCase(), currentFont);
        
        // Get font name
        const fontName = safeApplyFont(currentFont, currentFont);
        
        // Get prefix safely
        let prefixDisplay = prefix || '.';
        try {
            if (config.getCurrentPrefix) {
                const p = config.getCurrentPrefix();
                if (p !== undefined) prefixDisplay = p;
            }
            if (config.isPrefixless) {
                prefixDisplay = 'none';
            }
        } catch (e) {}
        const prefixText = safeApplyFont(String(prefixDisplay), currentFont);
        
        // Get owner info
        let ownerNumber = 'Not set';
        try {
            if (config.OWNER_NUMBER && config.OWNER_NUMBER !== '255700000000') {
                ownerNumber = `+${config.OWNER_NUMBER}`;
            }
        } catch (e) {}
        const ownerText = safeApplyFont(ownerNumber, currentFont);
        
        // Get commands count
        let commandsCount = 0;
        try {
            if (config.commandsCount) commandsCount = config.commandsCount;
        } catch (e) {}
        const cmdsText = safeApplyFont(`${commandsCount}`, currentFont);
        
        // Get date and time
        const now = new Date();
        const date = safeApplyFont(now.toLocaleDateString('en-GB'), currentFont);
        const time = safeApplyFont(now.toLocaleTimeString('en-GB'), currentFont);
        
        // Labels with font
        const labelBot = safeApplyFont('🤖 Bot', currentFont);
        const labelVer = safeApplyFont('📌 Version', currentFont);
        const labelUp = safeApplyFont('⏱️ Uptime', currentFont);
        const labelMem = safeApplyFont('💾 Memory', currentFont);
        const labelPlat = safeApplyFont('🏗️ Platform', currentFont);
        const labelMode = safeApplyFont('🎛️ Mode', currentFont);
        const labelFont = safeApplyFont('🎨 Font', currentFont);
        const labelPrefix = safeApplyFont('💬 Prefix', currentFont);
        const labelOwner = safeApplyFont('👑 Owner', currentFont);
        const labelCmds = safeApplyFont('📊 Commands', currentFont);
        const labelDate = safeApplyFont('📅 Date', currentFont);
        const labelTime = safeApplyFont('🕐 Time', currentFont);
        const labelStatus = safeApplyFont('✅ Status', currentFont);
        
        const statusValue = safeApplyFont('🟢 ACTIVE & RUNNING', currentFont);
        
        // Get footer safely
        let footer = '> ® 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡';
        try {
            if (config.getFooter) {
                footer = config.getFooter();
            } else if (config.POWERED_BY) {
                footer = `> ® ${config.POWERED_BY}`;
            }
        } catch (e) {}
        const styledFooter = safeApplyFont(footer.replace('> ® ', ''), currentFont);
        
        // Build the message
        const message = `*╭┈┈┄⊰ ${botName} STATUS ⊱┄┄┄◈*\n\n*┋ •> ${labelBot}:* ${botName}\n*┋ •> ${labelVer}:* ${version}\n*┋ •> ${labelUp}:* ${uptimeText}\n*┋ •> ${labelMem}:* ${memoryText}\n*┋ •> ${labelPlat}:* ${platformText}\n*┋ •> ${labelMode}:* ${modeText}\n*┋ •> ${labelFont}:* ${fontName}\n*┋ •> ${labelPrefix}:* ${prefixText}\n*┋ •> ${labelOwner}:* ${ownerText}\n*┋ •> ${labelCmds}:* ${cmdsText}\n*┋ •> ${labelDate}:* ${date}\n*┋ •> ${labelTime}:* ${time}\n*┋ •> ${labelStatus}:* ${statusValue}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n> ® ${styledFooter}`;
        
        // Send message
        try {
            await sock.sendMessage(chatId, { 
                text: message,
                contextInfo: config.getContextInfo ? config.getContextInfo(msg) : {}
            }, { quoted: msg });
        } catch (sendError) {
            // Try without quoted if fails
            await sock.sendMessage(chatId, { text: message });
        }
    }
};
