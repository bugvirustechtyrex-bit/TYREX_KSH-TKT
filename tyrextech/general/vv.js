// ============================================
// VIEW ONCE COMMAND - View and save view once media
// Captures view once images/videos before they disappear
// Powered by Tyrex KSH Tech
// ============================================

export default {
    name: 'viewonce',
    description: 'View and save view once images/videos',
    category: 'tools',
    alias: ['vo', 'readonce', 'once', 'viewonce', 'lihatsekali'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        
        // Check if replying to a message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg) {
            await sock.sendMessage(chatId, {
                text: `📸 *VIEW ONCE COMMAND*\n\n📝 *Usage:*\nReply to a view once image/video with:\n${prefix}viewonce\n\nOr:\n${prefix}vo\n\n⚠️ *Note:* This captures view once media before it disappears.`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Check for view once image
        let mediaBuffer = null;
        let mediaType = null;
        let caption = '';
        
        // Check for view once image message
        if (quotedMsg.imageMessage) {
            const imgMsg = quotedMsg.imageMessage;
            
            if (imgMsg.viewOnce) {
                mediaType = 'image';
                caption = imgMsg.caption || '';
                
                try {
                    // Download the view once image
                    const stream = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo.quotedMessage);
                    mediaBuffer = Buffer.from(await streamToBuffer(stream));
                } catch (error) {
                    console.error('Download error:', error);
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ This is not a view once image!\n\nReply to a 🔒 *View Once* image.',
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
        }
        // Check for view once video
        else if (quotedMsg.videoMessage) {
            const vidMsg = quotedMsg.videoMessage;
            
            if (vidMsg.viewOnce) {
                mediaType = 'video';
                caption = vidMsg.caption || '';
                
                try {
                    const stream = await sock.downloadMediaMessage(msg.message.extendedTextMessage.contextInfo.quotedMessage);
                    mediaBuffer = Buffer.from(await streamToBuffer(stream));
                } catch (error) {
                    console.error('Download error:', error);
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ This is not a view once video!\n\nReply to a 🔒 *View Once* video.',
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
        }
        else {
            await sock.sendMessage(chatId, {
                text: '❌ Reply to a view once image or video!\n\nSend a 🔒 *View Once* media and reply with .viewonce',
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
            return;
        }
        
        // Send the captured media
        if (mediaBuffer && mediaType) {
            const senderName = sender.split('@')[0];
            const timestamp = new Date().toLocaleString();
            
            const captionText = `🔓 *VIEW ONCE CAPTURED*\n\n📅 Time: ${timestamp}\n👤 From: @${senderName}\n📝 Caption: ${caption || 'None'}\n\n⚡ Saved before disappearing!`;
            
            if (mediaType === 'image') {
                await sock.sendMessage(chatId, {
                    image: mediaBuffer,
                    caption: captionText,
                    mentions: [sender],
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            } else if (mediaType === 'video') {
                await sock.sendMessage(chatId, {
                    video: mediaBuffer,
                    caption: captionText,
                    mentions: [sender],
                    gifPlayback: false,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            }
            
            // Also send to DM for backup (optional)
            try {
                const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                await sock.sendMessage(botNumber, {
                    text: `📸 View Once Saved\nFrom: @${senderName}\nTime: ${timestamp}\nGroup: ${chatId}`,
                    mentions: [sender]
                });
            } catch (e) {}
            
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to capture view once media!\n\nMake sure you reply to the view once message immediately.',
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};

// Helper function to convert stream to buffer
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
