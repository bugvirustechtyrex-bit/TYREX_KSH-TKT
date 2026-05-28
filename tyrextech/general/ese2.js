// ============================================
// ESE COMMAND - Elimu Soma Elimu (Font Test)
// Shows all font styles for testing
// Powered by SILA TECH
// ============================================

export default {
    name: 'ese2',
    description: 'Test font styles - shows your text in all available fonts',
    category: 'general',
    alias: ['fonttest', 'testfont', 'styles', 'showfonts'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Get all available font styles
        const fontStyles = config.getFontStyles ? config.getFontStyles() : [
            'normal', 'bold', 'italic', 'monospace', 'cursive', 'doubleStruck'
        ];
        
        // Get current bot font
        const currentFont = config.BOT_FONT || 'bold';
        
        // If no arguments, show demo text
        if (!args[0]) {
            const demoText = "SILA SMD";
            const currentStyled = config.applyFont(demoText, currentFont);
            
            let message = `*╭┈┈┄⊰ ESE - FONT TEST ⊱┄┄┄◈*\n\n`;
            message += `*┋ •> 🎨 Current Bot Font:* ${currentFont}\n`;
            message += `*┋ •> 📝 Current Style:* ${currentStyled}\n`;
            message += `*┋*\n`;
            message += `*┋ •> 📋 All Font Styles:*\n`;
            
            for (const font of fontStyles) {
                const styled = config.applyFont(demoText, font);
                const marker = font === currentFont ? '✅' : '  ';
                message += `*┋ •> ${marker} ${font}:* ${styled}\n`;
            }
            
            message += `*┋*\n`;
            message += `*┋ •> 📋 Usage:*\n`;
            message += `*┋ •> ${prefix}ese <text> - Convert text with current font\n`;
            message += `*┋ •> ${prefix}ese all <text> - Show text in all fonts\n`;
            message += `*┋ •> ${prefix}setfont <font> - Change bot font\n`;
            message += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`;
            
            await sock.sendMessage(chatId, { 
                text: message,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Check if user wants to see all fonts
        if (args[0].toLowerCase() === 'all') {
            const userText = args.slice(1).join(' ');
            if (!userText) {
                await sock.sendMessage(chatId, { 
                    text: `❌ *Please provide text to convert!*\n\nExample: ${prefix}ese all Hello World`,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            let message = `*╭┈┈┄⊰ ESE - ALL FONTS ⊱┄┄┄◈*\n\n`;
            message += `*┋ •> 📝 Original:* ${userText}\n*┋*\n`;
            
            for (const font of fontStyles) {
                const styled = config.applyFont(userText, font);
                message += `*┋ •> ${font}:* ${styled}\n`;
            }
            
            message += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`;
            
            await sock.sendMessage(chatId, { 
                text: message,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Normal conversion - use current font
        const userText = args.join(' ');
        const styledText = config.applyFont(userText, currentFont);
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ESE - ELIMU SOMA ELIMU ⊱┄┄┄◈*\n\n*┋ •> 🎨 Font:* ${currentFont}\n*┋*\n*┋ •> ✨ Result:*\n*┋ •> ${styledText}\n*┋*\n*┋ •> 📝 Original:* ${userText}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
