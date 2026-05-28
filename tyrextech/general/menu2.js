// ============================================
// HELP COMMAND - Show all commands
// Powered by SILA TECH
// ============================================

export default {
    name: 'help2',
    description: 'Show all available commands',
    category: 'general',
    alias: ['menu2', 'commands2', 'cmds2', 'list2'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const styledName = config.styledName || config.BOT_NAME;
        const commands = config.commands || new Map();
        const commandCategories = config.commandCategories || new Map();
        
        let helpText = `*╭┈┈┄⊰ ${styledName} MENU ⊱┄┄┄◈*\n\n`;
        helpText += `*┋ •> 📌 Version:* ${config.BOT_VERSION}\n`;
        helpText += `*┋ •> 💬 Prefix:* ${config.isPrefixless ? 'none' : prefix}\n`;
        helpText += `*┋ •> 📊 Commands:* ${commands.size}\n`;
        helpText += `*┋*\n`;
        
        for (const [category, cmdList] of commandCategories) {
            helpText += `*┋ •> 📁 ${category.toUpperCase()}* (${cmdList.length})\n`;
            const displayCmds = cmdList.slice(0, 10);
            displayCmds.forEach(cmd => {
                helpText += `*┋ •> • ${prefix}${cmd}*\n`;
            });
            if (cmdList.length > 10) {
                helpText += `*┋ •> • ... and ${cmdList.length - 10} more*\n`;
            }
            helpText += `*┋*\n`;
        }
        
        helpText += `*┋ •> 🔗 Anti-Link:* ${prefix}antilink on/off\n`;
        helpText += `*┋ •> 📵 Anti-Status:* ${prefix}antistatus on/off\n`;
        helpText += `*┋ •> 🗑️ Anti-Delete:* ${prefix}antidelete on/off\n`;
        helpText += `*┋ •> 📷 Anti-Media:* ${prefix}antimedia on/off\n`;
        helpText += `*┋ •> 🤬 Anti-Badword:* ${prefix}antibadword on/off\n`;
        helpText += `*┋ •> 🤖 Chatbot:* ${prefix}chatbot on/off\n`;
        helpText += `*┋ •> 🔗 Auto Group:* ${prefix}autojoin on/off\n`;
        helpText += `*┋ •> 📢 Follow Channel:* ${prefix}followchannel\n`;
        helpText += `*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${config.getFooter()}`;
        
        await sock.sendMessage(chatId, { 
            text: helpText,
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
