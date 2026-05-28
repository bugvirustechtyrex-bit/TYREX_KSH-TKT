// ============================================
// SETNAME COMMAND - Change bot name
// Owner Only
// Powered by SILA TECH
// ============================================

export default {
    name: 'setname',
    description: 'Change bot name',
    category: 'owner',
    alias: ['botname', 'changename', 'setbotname'],
    ownerOnly: true,
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        if (!args[0]) {
            const currentName = config.BOT_NAME;
            const styledName = config.applyFont(currentName, config.BOT_FONT || 'bold');
            
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ SET BOT NAME ⊱┄┄┄◈*\n\n*┋ •> 🤖 Current Name:* ${currentName}\n*┋ •> 📝 Styled:* ${styledName}\n*┋*\n*┋ •> 📋 Usage:* ${prefix}setname <new_name>\n*┋ •> Example:* ${prefix}setname SILA MD\n*┋ •> ${prefix}setname "SILA BOT"\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        const newName = args.join(' ');
        
        // Update using config.updateConfig
        if (config.updateConfig) {
            config.updateConfig('BOT_NAME', newName);
        }
        
        // Update process.env for compatibility
        process.env.BOT_NAME = newName;
        
        const fontStyle = config.BOT_FONT || 'bold';
        const oldStyled = config.applyFont(config.BOT_NAME, fontStyle);
        const newStyled = config.applyFont(newName, fontStyle);
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ BOT NAME CHANGED ⊱┄┄┄◈*\n\n*┋ •> 🤖 Old Name:* ${config.BOT_NAME}\n*┋ •> 🤖 New Name:* ${newName}\n*┋*\n*┋ •> 📝 Old Styled:* ${oldStyled}\n*┋ •> 📝 New Styled:* ${newStyled}\n*┋*\n*┋ •> ✅ Name updated successfully!*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
        
        // Update terminal header if function exists
        if (config.updateTerminalHeader) {
            config.updateTerminalHeader();
        }
    }
};
