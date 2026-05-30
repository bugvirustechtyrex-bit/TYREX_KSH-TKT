// commands/tools/viewonce.js
// Simple version for testing

export default {
    name: 'viewonce',
    description: 'View once media capture',
    category: 'tools',
    alias: ['vo', 'once'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        
        // Test if command works
        await sock.sendMessage(chatId, {
            text: '✅ Viewonce command is working! Reply to a view once image/video with .viewonce',
            contextInfo: config.getContextInfo(msg)
        }, { quoted: msg });
    }
};
