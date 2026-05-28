// ============================================
// SILA ANTI-MEDIA - Media Blocking System
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAdmin } from './isAdmin.js';
import { isOwnerOrSudo } from './isOwner.js';
import { applyFont } from './fonts/index.js';
import { getFooter } from '../tyrexconfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Store anti-media settings for each group
const antiMediaSettings = new Map();

// ============ FILE OPERATIONS ============
function getSettingsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antimedia.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antimedia_warns.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiMediaSettings(groupId) {
    const settingsFile = getSettingsFile();
    try {
        if (fs.existsSync(settingsFile)) {
            const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            return data[groupId] || { enabled: false, actions: { image: false, video: false, audio: false, document: false, sticker: false, text: false, emoji: false }, action: 'delete' };
        }
    } catch (error) {}
    return antiMediaSettings.get(groupId) || { enabled: false, actions: { image: false, video: false, audio: false, document: false, sticker: false, text: false, emoji: false }, action: 'delete' };
}

export async function saveAntiMediaSettings(groupId, settings) {
    antiMediaSettings.set(groupId, settings);
    const settingsFile = getSettingsFile();
    try {
        let data = {};
        if (fs.existsSync(settingsFile)) {
            data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        }
        data[groupId] = settings;
        fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) { return false; }
}

// ============ WARNINGS MANAGEMENT ============
export async function addAntiMediaWarn(groupId, userId) {
    const key = `${groupId}|${userId}`;
    const warnFile = getWarningsFile();
    let warns = {};
    try {
        if (fs.existsSync(warnFile)) {
            warns = JSON.parse(fs.readFileSync(warnFile, 'utf8'));
        }
    } catch (error) {}
    const currentWarn = (warns[key] || 0) + 1;
    warns[key] = currentWarn;
    fs.writeFileSync(warnFile, JSON.stringify(warns, null, 2));
    return currentWarn;
}

export async function resetAntiMediaWarns(groupId, userId) {
    const key = `${groupId}|${userId}`;
    const warnFile = getWarningsFile();
    let warns = {};
    try {
        if (fs.existsSync(warnFile)) {
            warns = JSON.parse(fs.readFileSync(warnFile, 'utf8'));
        }
    } catch (error) {}
    delete warns[key];
    fs.writeFileSync(warnFile, JSON.stringify(warns, null, 2));
    return true;
}

// ============ MEDIA DETECTION ============
export function detectMessageType(msg) {
    if (msg.message?.imageMessage) return 'image';
    if (msg.message?.videoMessage) return 'video';
    if (msg.message?.audioMessage) return 'audio';
    if (msg.message?.documentMessage) return 'document';
    if (msg.message?.stickerMessage) return 'sticker';
    if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) return 'text';
    return null;
}

export function containsOnlyEmojis(text) {
    if (!text) return false;
    const emojiRegex = /^[\p{Emoji}\s]+$/u;
    return emojiRegex.test(text);
}

// ============ MAIN HANDLER ============
export async function handleAntiMedia(sock, msg, chatId, senderJid, messageType, textContent, botName, botFont) {
    try {
        const settings = await getAntiMediaSettings(chatId);
        if (!settings.enabled) return false;
        
        const isEnabled = settings.actions[messageType];
        if (!isEnabled) return false;
        
        const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (isSenderAdmin.isSenderAdmin || isOwner) return false;
        
        const action = settings.action || 'delete';
        const styledName = applyFont(botName, botFont);
        
        // Delete the message
        try {
            await sock.sendMessage(chatId, { delete: msg.key });
        } catch (e) {}
        
        let mediaTypeName = messageType;
        if (messageType === 'text' && textContent && containsOnlyEmojis(textContent)) mediaTypeName = 'emoji';
        
        const warningText = `*╭┈┈┄⊰ ${styledName} - ANTI MEDIA ⊱┄┄┄◈*\n\n*┋ •> 📵 @${senderJid.split('@')[0]} sent ${mediaTypeName}*\n*┋ •> 📋 ${mediaTypeName} is not allowed here!*\n*┋ •> 🔒 Message deleted*`;
        
        await sock.sendMessage(chatId, { 
            text: warningText, 
            contextInfo: { mentionedJid: [senderJid] } 
        });
        
        if (action === 'kick') {
            const adminStatus = await isAdmin(sock, chatId, senderJid);
            if (adminStatus.isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                await sock.sendMessage(chatId, { 
                    text: `🚫 @${senderJid.split('@')[0]} KICKED for sending ${mediaTypeName}!`, 
                    mentions: [senderJid] 
                });
            }
        } else if (action === 'warn') {
            const warnCount = await addAntiMediaWarn(chatId, senderJid);
            
            if (warnCount >= 3) {
                await resetAntiMediaWarns(chatId, senderJid);
                const adminStatus = await isAdmin(sock, chatId, senderJid);
                if (adminStatus.isBotAdmin) {
                    await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                    await sock.sendMessage(chatId, { 
                        text: `🚨 @${senderJid.split('@')[0]} KICKED for 3 media warnings!`, 
                        mentions: [senderJid] 
                    });
                }
            }
        }
        return true;
    } catch (error) {
        console.error('Anti-media error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiMediaCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '❌ *This command can only be used in groups!*',
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    let isAuthorized = false;
    const isOwnerSudo = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isOwnerSudo) isAuthorized = true;
    if (!isAuthorized) {
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        if (adminStatus.isSenderAdmin) isAuthorized = true;
    }
    if (!isAuthorized) {
        await sock.sendMessage(chatId, { 
            text: '❌ *Only group admins and bot owner can use this command!*',
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    const currentSettings = await getAntiMediaSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-MEDIA ⊱┄┄┄◈*\n\n*┋ •> 🔒 Status:* ${currentSettings.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n*┋ •> ⚡ Action:* ${currentSettings.action}\n*┋*\n*┋ •> Blocked Types:*\n*┋ •> 📷 Image: ${currentSettings.actions.image ? '✅' : '❌'}\n*┋ •> 🎥 Video: ${currentSettings.actions.video ? '✅' : '❌'}\n*┋ •> 🎵 Audio: ${currentSettings.actions.audio ? '✅' : '❌'}\n*┋ •> 📄 Document: ${currentSettings.actions.document ? '✅' : '❌'}\n*┋ •> 🏷️ Sticker: ${currentSettings.actions.sticker ? '✅' : '❌'}\n*┋ •> 📝 Text: ${currentSettings.actions.text ? '✅' : '❌'}\n*┋ •> 😀 Emoji: ${currentSettings.actions.emoji ? '✅' : '❌'}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}antimedia on/off\n*┋ •> ${prefix}antimedia action delete/warn/kick\n*┋ •> ${prefix}antimedia <type> on/off\n*┋ •> Types: image, video, audio, document, sticker, text, emoji\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    if (action === 'on' || action === 'enable') {
        currentSettings.enabled = true;
        await saveAntiMediaSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-MEDIA ⊱┄┄┄◈*\n\n*┋ •> 📵 Anti-media has been* *ENABLED*\n*┋ •> 👤 Enabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'off' || action === 'disable') {
        currentSettings.enabled = false;
        await saveAntiMediaSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-MEDIA ⊱┄┄┄◈*\n\n*┋ •> 🔓 Anti-media has been* *DISABLED*\n*┋ •> 👤 Disabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (!['delete', 'warn', 'kick'].includes(newAction)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid action! Use: ${prefix}antimedia action delete/warn/kick`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.action = newAction;
        await saveAntiMediaSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-MEDIA ⊱┄┄┄◈*\n\n*┋ •> ⚡ Action set to:* *${newAction.toUpperCase()}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else {
        const mediaType = action;
        const mediaAction = args[1]?.toLowerCase();
        if (!['image', 'video', 'audio', 'document', 'sticker', 'text', 'emoji'].includes(mediaType)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid media type! Use: image, video, audio, document, sticker, text, emoji`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        if (mediaAction === 'on') {
            currentSettings.actions[mediaType] = true;
            await saveAntiMediaSettings(chatId, currentSettings);
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ ${styledName} - ANTI-MEDIA ⊱┄┄┄◈*\n\n*┋ •> 📵 ${mediaType.toUpperCase()} is now* *BLOCKED*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
        } else if (mediaAction === 'off') {
            currentSettings.actions[mediaType] = false;
            await saveAntiMediaSettings(chatId, currentSettings);
            await sock.sendMessage(chatId, { 
                text: `*╭┈┈┄⊰ ${styledName} - ANTI-MEDIA ⊱┄┄┄◈*\n\n*┋ •> ✅ ${mediaType.toUpperCase()} is now* *ALLOWED*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { 
                text: `❌ Use: ${prefix}antimedia ${mediaType} on/off`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
        }
    }
}

export default {
    getAntiMediaSettings,
    saveAntiMediaSettings,
    addAntiMediaWarn,
    resetAntiMediaWarns,
    detectMessageType,
    containsOnlyEmojis,
    handleAntiMedia,
    handleAntiMediaCommand
};
