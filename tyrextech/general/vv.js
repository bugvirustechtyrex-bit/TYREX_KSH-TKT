// ============================================
// VIEW ONCE COMMAND - Reveal view-once media
// Powered by Tyrex KSH Tech
// ============================================

import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'viewonce',
    description: 'Reveal view-once image or video',
    category: 'tools',
    alias: ['vv', 'reveal', 'vo', 'once'],
    
    async execute(sock, msg, args, prefix, config) {
        try {
            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || chatId;
            
            // Check if replying to a message
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quotedMsg) {
                await sock.sendMessage(chatId, {
                    text: `👁️ *VIEW ONCE REVEAL*\n\n📝 Reply to a view-once image/video with:\n${prefix}viewonce\n${prefix}vv\n\n⚡ Reveals disappearing media!`,
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Handle view-once wrapper
            const viewOnceMsg = quotedMsg.viewOnceMessageV2 || 
                               quotedMsg.viewOnceMessage || 
                               null;
            
            const mediaMessage = viewOnceMsg?.message?.imageMessage ||
                                viewOnceMsg?.message?.videoMessage ||
                                quotedMsg.imageMessage ||
                                quotedMsg.videoMessage;
            
            if (!mediaMessage) {
                await sock.sendMessage(chatId, {
                    text: '❌ *Unsupported message type*\n\nReply to a view-once image or video.',
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            // Check if it's view-once
            if (!mediaMessage.viewOnce) {
                await sock.sendMessage(chatId, {
                    text: '❌ *This is not a view-once media*\n\nReply to a 🔒 view-once image/video.',
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
                return;
            }
            
            const isImage = mediaMessage.mimetype?.startsWith("image") || 
                           !!viewOnceMsg?.message?.imageMessage ||
                           !!quotedMsg.imageMessage;
            
            const isVideo = mediaMessage.mimetype?.startsWith("video") || 
                           !!viewOnceMsg?.message?.videoMessage ||
                           !!quotedMsg.videoMessage;
            
            // Send reaction
            const reactions = ['👁️', '🔓', '📸', '🎥', '✨', '⚡', '🔥'];
            const randomReact = reactions[Math.floor(Math.random() * reactions.length)];
            
            await sock.sendMessage(chatId, {
                react: { text: randomReact, key: msg.key }
            });
            
            // Download media
            const stream = await downloadContentFromMessage(
                mediaMessage,
                isImage ? "image" : "video"
            );
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            // Prepare caption
            const mediaType = isImage ? "🖼️ IMAGE" : "🎥 VIDEO";
            const timestamp = new Date().toLocaleString();
            const botName = config.BOT_NAME || "Tyrex KSH MD";
            
            const caption = `╭━━━━━━━━━━━━━━━━━━╮
│  👁️ *VIEW ONCE REVEALED*  │
╰━━━━━━━━━━━━━━━━━━╯

┋ 📸 *Type:* ${mediaType}
┋ 👤 *Revealed by:* @${sender.split('@')[0]}
┋ 📅 *Time:* ${timestamp}
╰━━━━━━━━━━━━━━━━━━╯

> ® ${config.POWERED_BY || "Tyrex KSH Tech"}`;
            
            // Send revealed media
            if (isImage) {
                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption: caption,
                    mentions: [sender],
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    video: buffer,
                    caption: caption,
                    mentions: [sender],
                    contextInfo: config.getContextInfo(msg)
                }, { quoted: msg });
            }
            
        } catch (error) {
            console.error('ViewOnce Error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *Failed to reveal view-once media*\n\nError: ${error.message}`,
                contextInfo: config.getContextInfo(msg)
            }, { quoted: msg });
        }
    }
};
