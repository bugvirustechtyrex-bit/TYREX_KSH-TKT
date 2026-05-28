// ============================================
// ESE COMMAND - Elimu Soma Elimu (Test Font)
// Changes text style based on selected bot font
// Powered by SILA TECH
// ============================================

export default {
    name: 'ese',
    description: 'Transform your text using selected bot font',
    category: 'general',
    alias: ['fonttest', 'testfont', 'style', 'convert', 'sila'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // If no arguments, show usage
        if (!args[0]) {
            const currentFont = config.BOT_FONT || 'bold';
            const exampleText = "SILA SMD";
            const styledExample = config.applyFont(exampleText, currentFont);
            
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ ESE - ELIMU SOMA ELIMU ⊱┄┄┄◈*\n\n*┋ •> 🎨 Current Bot Font:* ${currentFont}\n*┋ •> 📝 Example:* ${styledExample}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}ese <text>\n*┋ •> ${prefix}ese Hello World\n*┋*\n*┋ •> 🔄 Try changing font first:*\n*┋ •> ${prefix}setfont bold\n*┋ •> ${prefix}setfont italic\n*┋ •> ${prefix}setfont monospace\n*┋ •> ${prefix}setfont cursive\n*┋ •> ${prefix}setfont doubleStruck\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Get current bot font
        const currentFont = config.BOT_FONT || 'bold';
        const userText = args.join(' ');
        
        // Apply font to user's text
        const styledText = config.applyFont(userText, currentFont);
        
        // Create a beautiful message
        const botName = config.applyFont(config.BOT_NAME, currentFont);
        const footerText = config.getFooter();
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ESE - ELIMU SOMA ELIMU ⊱┄┄┄◈*\n\n*┋ •> 🎨 Font Style:* ${currentFont}\n*┋*\n*┋ •> 📝 Your Text:*\n*┋ •> ${styledText}\n*┋*\n*┋ •> 💬 Original:* ${userText}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${footerText}`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
