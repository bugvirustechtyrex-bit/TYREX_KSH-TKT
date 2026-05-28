// ============================================
// SILA ANTI-STATUS - Status Mention System
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

// Store anti-status settings for each group
const antiStatusSettings = new Map();

// Random insults for admins who send status mentions
const ADMIN_INSULTS = [
    "🤦‍♀️ *Seriously admin?* You know better than this!",
    "🧠 *Use your brain cells!* Status mentions are forbidden!",
    "👑 *Admin?* Never mind. Just don't do that again!",
    "💀 *Even admins can't status mention here!*",
    "🤡 *Admin caught in 4K!* Status mentions are a no-no!"
];

function getRandomInsult() {
    return ADMIN_INSULTS[Math.floor(Math.random() * ADMIN_INSULTS.length)];
}

function formatStatusMsg(text, botName, botFont) {
    const styledName = applyFont(botName, botFont);
    return `*╭┈┈┄⊰ ${styledName} - ANTI STATUS ⊱┄┄┄◈*\n\n${text}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`;
}

// ============ FILE OPERATIONS ============
function getSettingsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antistatus.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antistatus_warns.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiStatusSettings(groupId) {
    const settingsFile = getSettingsFile();
    try {
        if (fs.existsSync(settingsFile)) {
            const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete', warnLimit: 3 };
        }
    } catch (error) {}
    return antiStatusSettings.get(groupId) || { enabled: false, action: 'delete', warnLimit: 3 };
}

export async function saveAntiStatusSettings(groupId, settings) {
    antiStatusSettings.set(groupId, settings);
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
export async function addAntiStatusWarn(groupId, userId) {
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

export async function resetAntiStatusWarns(groupId, userId) {
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

// ============ MAIN HANDLER ============
export async function handleStatusMention(sock, message, chatId, isGroup, botName, botFont) {
    try {
        if (!isGroup) return false;
        if (!message.message?.groupStatusMentionMessage) return false;
        
        const settings = await getAntiStatusSettings(chatId);
        if (!settings.enabled) return false;
        
        const senderId = message.key.participant || message.key.remoteJid;
        if (!senderId) return false;
        
        const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
        if (isOwnerSudo) return false;
        
        let isSenderAdmin = false, isBotAdmin = false;
        try {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;
        } catch {}
        
        if (isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: formatStatusMsg(`${getRandomInsult()}\n> └ @${senderId.split('@')[0]}`, botName, botFont),
                mentions: [senderId]
            });
            return true;
        }
        
        // Delete the message
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch {}
        
        const action = settings.action || 'delete';
        
        if (action === 'kick') {
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { 
                    text: formatStatusMsg(`@${senderId.split('@')[0]} sent status mention.\n> Make me admin to kick! 😤`, botName, botFont), 
                    mentions: [senderId] 
                });
                return true;
            }
            await sock.groupParticipantsUpdate(chatId, [senderId], "remove");
            await sock.sendMessage(chatId, { 
                text: formatStatusMsg(`🚫 @${senderId.split('@')[0]} KICKED for status mention!`, botName, botFont), 
                mentions: [senderId] 
            });
            return true;
        }
        
        if (action === 'warn') {
            const maxWarns = settings.warnLimit || 3;
            const warnCount = await addAntiStatusWarn(chatId, senderId);
            const remaining = maxWarns - warnCount;
            
            if (warnCount >= maxWarns) {
                await resetAntiStatusWarns(chatId, senderId);
                if (isBotAdmin) {
                    await sock.groupParticipantsUpdate(chatId, [senderId], "remove");
                    await sock.sendMessage(chatId, { 
                        text: formatStatusMsg(`🚨 @${senderId.split('@')[0]} KICKED!\n> Warns: ${warnCount}/${maxWarns}`, botName, botFont), 
                        mentions: [senderId] 
                    });
                }
                return true;
            }
            await sock.sendMessage(chatId, { 
                text: formatStatusMsg(`⚠️ @${senderId.split('@')[0]} WARNED!\n> Warns: ${warnCount}/${maxWarns}\n> ${remaining} more and you're GONE!`, botName, botFont), 
                mentions: [senderId] 
            });
            return true;
        }
        
        if (action === 'delete') {
            await sock.sendMessage(chatId, { 
                text: formatStatusMsg(`📵 @${senderId.split('@')[0]}, status mentions are NOT allowed here!\n> Message deleted.`, botName, botFont), 
                mentions: [senderId] 
            });
            return true;
        }
        
        return true;
    } catch (error) { 
        console.error('Status mention error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiStatusCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
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
    
    const currentSettings = await getAntiStatusSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    if (!action) {
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-STATUS ⊱┄┄┄◈*\n\n*┋ •> 🔒 Status:* ${currentSettings.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n*┋ •> ⚡ Action:* ${currentSettings.action}\n*┋ •> 📛 Warn Limit:* ${currentSettings.warnLimit}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}antistatus on/off\n*┋ •> ${prefix}antistatus action delete/warn/kick\n*┋ •> ${prefix}antistatus warnlimit <number>\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    if (action === 'on' || action === 'enable') {
        currentSettings.enabled = true;
        await saveAntiStatusSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-STATUS ⊱┄┄┄◈*\n\n*┋ •> 🔒 Anti-status has been* *ENABLED*\n*┋ •> 👤 Enabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'off' || action === 'disable') {
        currentSettings.enabled = false;
        await saveAntiStatusSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-STATUS ⊱┄┄┄◈*\n\n*┋ •> 🔓 Anti-status has been* *DISABLED*\n*┋ •> 👤 Disabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (!['delete', 'warn', 'kick'].includes(newAction)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid action! Use: ${prefix}antistatus action delete/warn/kick`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.action = newAction;
        await saveAntiStatusSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-STATUS ⊱┄┄┄◈*\n\n*┋ •> ⚡ Action set to:* *${newAction.toUpperCase()}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'warnlimit') {
        const newLimit = parseInt(args[1]);
        if (isNaN(newLimit) || newLimit < 1 || newLimit > 10) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid limit! Use 1-10`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.warnLimit = newLimit;
        await saveAntiStatusSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI-STATUS ⊱┄┄┄◈*\n\n*┋ •> 📛 Warn limit set to:* *${newLimit}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { 
            text: `❌ *Invalid option!*\n\nUse: ${prefix}antistatus <on/off/action/warnlimit>`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
}

export default {
    getAntiStatusSettings,
    saveAntiStatusSettings,
    addAntiStatusWarn,
    resetAntiStatusWarns,
    handleStatusMention,
    handleAntiStatusCommand
};
