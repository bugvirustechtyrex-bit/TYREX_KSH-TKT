// ============================================
// SILA ANTI-DELETE - Message Delete Detection
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

// Store anti-delete settings for each group
const antiDeleteSettings = new Map();
export const deletedMessagesCache = new Map();

// ============ FILE OPERATIONS ============
function getSettingsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antidelete.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antidelete_warns.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiDeleteSettings(groupId) {
    const settingsFile = getSettingsFile();
    try {
        if (fs.existsSync(settingsFile)) {
            const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            return data[groupId] || { enabled: false, action: 'warn', logChannel: null };
        }
    } catch (error) {}
    return antiDeleteSettings.get(groupId) || { enabled: false, action: 'warn', logChannel: null };
}

export async function saveAntiDeleteSettings(groupId, settings) {
    antiDeleteSettings.set(groupId, settings);
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
export async function addAntiDeleteWarn(groupId, userId) {
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

export async function resetAntiDeleteWarns(groupId, userId) {
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

// ============ CACHE MANAGEMENT ============
export function cacheMessage(chatId, messageId, messageData) {
    const key = `${chatId}|${messageId}`;
    deletedMessagesCache.set(key, { ...messageData, timestamp: Date.now() });
    setTimeout(() => deletedMessagesCache.delete(key), 5 * 60 * 1000);
}

// ============ MAIN HANDLER ============
export async function handleMessageDelete(sock, chatId, messageId, senderId, deletedMsg, botName, botFont) {
    try {
        if (!chatId.endsWith('@g.us')) return false;
        
        const settings = await getAntiDeleteSettings(chatId);
        if (!settings.enabled) return false;
        
        const isDeleterAdmin = await isAdmin(sock, chatId, senderId);
        const isDeleterOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (isDeleterAdmin.isSenderAdmin || isDeleterOwner) return false;
        
        const action = settings.action || 'warn';
        const styledName = applyFont(botName, botFont);
        const deleteTime = new Date().toLocaleTimeString();
        
        const reportText = `*╭┈┈┄⊰ ${styledName} - ANTI DELETE ⊱┄┄┄◈*\n\n*┋ •> 🗑️ Message Deleted!*\n*┋ •> 👤 Deleted by:* @${senderId.split('@')[0]}\n*┋ •> 👤 Author:* @${deletedMsg.sender.split('@')[0]}\n*┋ •> 📝 Content:* ${deletedMsg.text || 'Media message'}\n*┋ •> 🕒 Time:* ${deleteTime}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`;
        
        if (settings.logChannel && settings.logChannel !== chatId) {
            await sock.sendMessage(settings.logChannel, { 
                text: reportText, 
                contextInfo: { mentionedJid: [senderId, deletedMsg.sender] } 
            });
        } else {
            await sock.sendMessage(chatId, { 
                text: reportText, 
                contextInfo: { mentionedJid: [senderId, deletedMsg.sender] } 
            });
        }
        
        if (action === 'kick') {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            if (!adminStatus.isSenderAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, { 
                    text: `🚫 @${senderId.split('@')[0]} KICKED for deleting messages!`, 
                    mentions: [senderId] 
                });
            }
        } else if (action === 'warn') {
            const warnCount = await addAntiDeleteWarn(chatId, senderId);
            
            if (warnCount >= 3) {
                await resetAntiDeleteWarns(chatId, senderId);
                const adminStatus = await isAdmin(sock, chatId, senderId);
                if (adminStatus.isBotAdmin) {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await sock.sendMessage(chatId, { 
                        text: `🚨 @${senderId.split('@')[0]} KICKED for 3 delete warnings!`, 
                        mentions: [senderId] 
                    });
                }
            }
        }
        return true;
    } catch (error) { 
        console.error('Anti-delete error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiDeleteCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const currentSettings = await getAntiDeleteSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> 🔒 Status:* ${currentSettings.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n*┋ •> ⚡ Action:* ${currentSettings.action}\n*┋ •> 📝 Log Channel:* ${currentSettings.logChannel || 'Same group'}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}antidelete on/off\n*┋ •> ${prefix}antidelete action warn/kick\n*┋ •> ${prefix}antidelete log <group_jid>\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    if (action === 'on' || action === 'enable') {
        currentSettings.enabled = true;
        await saveAntiDeleteSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> 🗑️ Anti-delete has been* *ENABLED*\n*┋ •> 👤 Enabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'off' || action === 'disable') {
        currentSettings.enabled = false;
        await saveAntiDeleteSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> 🔓 Anti-delete has been* *DISABLED*\n*┋ •> 👤 Disabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (!['warn', 'kick'].includes(newAction)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid action! Use: ${prefix}antidelete action warn/kick`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.action = newAction;
        await saveAntiDeleteSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> ⚡ Action set to:* *${newAction.toUpperCase()}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'log') {
        const logJid = args[1];
        if (!logJid || !logJid.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid group JID! Use a valid group JID.`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.logChannel = logJid;
        await saveAntiDeleteSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-DELETE ⊱┄┄┄◈*\n\n*┋ •> 📝 Log channel set to:* *${logJid}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { 
            text: `❌ *Invalid option!*\n\nUse: ${prefix}antidelete <on/off/action/log>`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
}

export default {
    getAntiDeleteSettings,
    saveAntiDeleteSettings,
    addAntiDeleteWarn,
    resetAntiDeleteWarns,
    cacheMessage,
    deletedMessagesCache,
    handleMessageDelete,
    handleAntiDeleteCommand
};
