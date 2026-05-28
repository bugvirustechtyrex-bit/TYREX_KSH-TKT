// ============================================
// SETFONT COMMAND - Change bot font style
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'setfont',
    description: 'Change bot font style (normal, bold, italic, monospace, cursive, doubleStruck)',
    category: 'owner',
    alias: ['font', 'changefont', 'style', 'setstyle'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Get available font styles
        const fontStyles = config.getFontStyles ? config.getFontStyles() : [
            'normal', 'bold', 'italic', 'monospace', 'cursive', 'doubleStruck'
        ];
        
        // If no args, show current font and available styles
        if (!args[0]) {
            const currentFont = config.BOT_FONT || 'bold';
            const styledCurrent = config.applyFont(config.BOT_NAME, currentFont);
            
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ SET BOT FONT ⊱┄┄┄◈*\n\n*┋ •> 🎨 Current Font:* ${currentFont}\n*┋ •> 📝 Preview:* ${styledCurrent}\n*┋*\n*┋ •> 📋 Available Fonts:*\n${fontStyles.map(f => `*┋ •> • ${f}*`).join('\n')}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}setfont <font_name>\n*┋ •> Example:* ${prefix}setfont bold\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        const newFont = args[0].toLowerCase();
        
        // Validate font
        if (!fontStyles.includes(newFont)) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Invalid font style!*\n\nAvailable fonts: ${fontStyles.join(', ')}\n\nExample: ${prefix}setfont bold`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Update using config.updateConfig
        if (config.updateConfig) {
            config.updateConfig('BOT_FONT', newFont);
        }
        
        // Update process.env for compatibility
        process.env.BOT_FONT = newFont;
        
        // Test the new font
        const oldStyled = config.applyFont(config.BOT_NAME, config.BOT_FONT || 'bold');
        const newStyled = config.applyFont(config.BOT_NAME, newFont);
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ FONT CHANGED ⊱┄┄┄◈*\n\n*┋ •> 🎨 Old Font:* ${config.BOT_FONT || 'bold'}\n*┋ •> 🎨 New Font:* ${newFont}\n*┋*\n*┋ •> 📝 Old Preview:* ${oldStyled}\n*┋ •> 📝 New Preview:* ${newStyled}\n*┋*\n*┋ •> ✅ Font updated successfully!*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
        
        // Update terminal header if function exists
        if (config.updateTerminalHeader) {
            config.updateTerminalHeader();
        }
    }
};
