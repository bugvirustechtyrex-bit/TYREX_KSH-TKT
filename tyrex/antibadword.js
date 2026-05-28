// ============================================
// SILA ANTI-BADWORD - Badword Detection System
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

// Default badwords list
const DEFAULT_BADWORDS = [
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'cunt', 'dick', 'pussy',
    'nigger', 'fag', 'retard', 'whore', 'slut', 'bastard', 'cock', 'porn',
    'sex', 'fucking', 's hit', 'f u ck', 'b1tch', 'a55', 'fuk', 'fack',
    'motherfucker', 'bullshit', 'goddamn', 'hell', 'stupid', 'idiot'
];

// Store anti-badword settings for each group
const antiBadwordSettings = new Map();

// ============ FILE OPERATIONS ============
function getSettingsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antibadword.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antibadword_warns.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiBadwordSettings(groupId) {
    const settingsFile = getSettingsFile();
    try {
        if (fs.existsSync(settingsFile)) {
            const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            return data[groupId] || { enabled: false, action: 'delete', customWords: [] };
        }
    } catch (error) {}
    return antiBadwordSettings.get(groupId) || { enabled: false, action: 'delete', customWords: [] };
}

export async function saveAntiBadwordSettings(groupId, settings) {
    antiBadwordSettings.set(groupId, settings);
    const settingsFile = getSettingsFile();
    try {
        let data = {};
        if (fs.existsSync(settingsFile)) {
            data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        }
        data[groupId] = settings;
        fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving anti-badword settings:', error);
        return false;
    }
}

// ============ WARNINGS MANAGEMENT ============
export async function addBadwordWarn(groupId, userId) {
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

export async function resetBadwordWarns(groupId, userId) {
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

export async function getBadwordWarnCount(groupId, userId) {
    const key = `${groupId}|${userId}`;
    const warnFile = getWarningsFile();
    try {
        if (fs.existsSync(warnFile)) {
            const warns = JSON.parse(fs.readFileSync(warnFile, 'utf8'));
            return warns[key] || 0;
        }
    } catch (error) {}
    return 0;
}

// ============ BADWORD DETECTION ============
function containsBadword(text, customWords = []) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    const allBadwords = [...DEFAULT_BADWORDS, ...customWords];
    
    // Direct check
    for (const word of allBadwords) {
        if (lowerText.includes(word) || lowerText.includes(word.replace(/[^a-z]/g, ''))) {
            return true;
        }
    }
    
    // Leet speak conversion
    const leetMap = { 
        '1': 'i', '3': 'e', '4': 'a', '5': 's', '0': 'o', 
        '7': 't', '$': 's', '@': 'a', '2': 'z', '8': 'b'
    };
    let cleaned = lowerText;
    for (const [leet, letter] of Object.entries(leetMap)) {
        cleaned = cleaned.replace(new RegExp(leet, 'g'), letter);
    }
    
    for (const word of allBadwords) {
        if (cleaned.includes(word)) return true;
    }
    
    return false;
}

// ============ MAIN HANDLER ============
export async function handleAntiBadword(sock, msg, chatId, senderJid, text, botName, botFont) {
    try {
        const settings = await getAntiBadwordSettings(chatId);
        if (!settings.enabled) return false;
        
        const allBadwords = [...DEFAULT_BADWORDS, ...(settings.customWords || [])];
        if (!containsBadword(text, allBadwords)) return false;
        
        // Check if sender is admin or owner (they can bypass)
        const isSenderAdmin = await isAdmin(sock, chatId, senderJid);
        const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
        
        if (isSenderAdmin.isSenderAdmin || isOwner) return false;
        
        const action = settings.action || 'delete';
        const styledName = applyFont(botName, botFont);
        
        // Delete the message
        try {
            await sock.sendMessage(chatId, { delete: msg.key });
        } catch (e) {}
        
        const warningText = `*╭┈┈┄⊰ ${styledName} - ANTI BADWORD ⊱┄┄┄◈*\n\n*┋ •> 🤬 @${senderJid.split('@')[0]} used bad language!*\n*┋ •> 🔒 Message deleted*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`;
        
        await sock.sendMessage(chatId, { 
            text: warningText, 
            contextInfo: { mentionedJid: [senderJid] } 
        });
        
        // Handle action
        if (action === 'kick') {
            const adminStatus = await isAdmin(sock, chatId, senderJid);
            if (adminStatus.isBotAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                await sock.sendMessage(chatId, { 
                    text: `🚫 @${senderJid.split('@')[0]} KICKED for bad language!`, 
                    mentions: [senderJid] 
                });
            }
        } else if (action === 'warn') {
            const warnCount = await addBadwordWarn(chatId, senderJid);
            
            if (warnCount >= 3) {
                await resetBadwordWarns(chatId, senderJid);
                const adminStatus = await isAdmin(sock, chatId, senderJid);
                if (adminStatus.isBotAdmin) {
                    await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                    await sock.sendMessage(chatId, { 
                        text: `🚨 @${senderJid.split('@')[0]} KICKED for 3 badword warnings!`, 
                        mentions: [senderJid] 
                    });
                }
            }
        }
        
        return true;
    } catch (error) {
        console.error('Anti-badword error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiBadwordCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '❌ *This command can only be used in groups!*',
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    // Check authorization (admin or owner)
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
    
    const currentSettings = await getAntiBadwordSettings(chatId);
    const action = args[0]?.toLowerCase();
    const styledName = applyFont(botName, botFont);
    
    // Show status
    if (!action) {
        const statusText = currentSettings.enabled ? '✅ ENABLED' : '❌ DISABLED';
        const actionText = currentSettings.action === 'kick' ? '🚫 Kick' : (currentSettings.action === 'warn' ? '⚠️ Warn' : '📵 Delete');
        
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI BADWORD ⊱┄┄┄◈*\n\n*┋ •> 🔒 Status:* ${statusText}\n*┋ •> ⚡ Action:* ${actionText}\n*┋ •> 📝 Custom Words:* ${currentSettings.customWords?.length || 0}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}antibadword on/off\n*┋ •> ${prefix}antibadword action delete/warn/kick\n*┋ •> ${prefix}antibadword add <word>\n*┋ •> ${prefix}antibadword remove <word>\n*┋ •> ${prefix}antibadword list\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    // Handle enable/disable
    if (action === 'on' || action === 'enable') {
        currentSettings.enabled = true;
        await saveAntiBadwordSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI BADWORD ⊱┄┄┄◈*\n\n*┋ •> 🤬 Anti-badword has been* *ENABLED*\n*┋ •> 👤 Enabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    else if (action === 'off' || action === 'disable') {
        currentSettings.enabled = false;
        await saveAntiBadwordSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI BADWORD ⊱┄┄┄◈*\n\n*┋ •> 🔓 Anti-badword has been* *DISABLED*\n*┋ •> 👤 Disabled by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    // Handle action setting
    else if (action === 'action') {
        const newAction = args[1]?.toLowerCase();
        if (!newAction || !['delete', 'warn', 'kick'].includes(newAction)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Invalid action! Use: ${prefix}antibadword action delete/warn/kick`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        currentSettings.action = newAction;
        await saveAntiBadwordSettings(chatId, currentSettings);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTI BADWORD ⊱┄┄┄◈*\n\n*┋ •> ⚡ Action set to:* *${newAction.toUpperCase()}*\n*┋ •> 👤 Changed by:* @${senderJid.split('@')[0]}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    // Handle add custom word
    else if (action === 'add') {
        const newWord = args[1]?.toLowerCase();
        if (!newWord) {
            await sock.sendMessage(chatId, { 
                text: `❌ Provide a word to add!\n\nUsage: ${prefix}antibadword add <word>`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        if (!currentSettings.customWords) currentSettings.customWords = [];
        if (!currentSettings.customWords.includes(newWord)) {
            currentSettings.customWords.push(newWord);
            await saveAntiBadwordSettings(chatId, currentSettings);
            await sock.sendMessage(chatId, { 
                text: `✅ Added "${newWord}" to badword list!`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { 
                text: `⚠️ "${newWord}" is already in the list!`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
        }
    }
    // Handle remove custom word
    else if (action === 'remove') {
        const removeWord = args[1]?.toLowerCase();
        if (!removeWord) {
            await sock.sendMessage(chatId, { 
                text: `❌ Provide a word to remove!\n\nUsage: ${prefix}antibadword remove <word>`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
            return;
        }
        if (currentSettings.customWords && currentSettings.customWords.includes(removeWord)) {
            currentSettings.customWords = currentSettings.customWords.filter(w => w !== removeWord);
            await saveAntiBadwordSettings(chatId, currentSettings);
            await sock.sendMessage(chatId, { 
                text: `✅ Removed "${removeWord}" from badword list!`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
        } else {
            await sock.sendMessage(chatId, { 
                text: `⚠️ "${removeWord}" not found in the list!`,
                contextInfo: { mentionedJid: [senderJid] }
            }, { quoted: msg });
        }
    }
    // Handle list custom words
    else if (action === 'list') {
        const words = currentSettings.customWords || [];
        const wordList = words.length > 0 ? words.map(w => `• ${w}`).join('\n') : 'No custom words added';
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - CUSTOM BADWORDS ⊱┄┄┄◈*\n\n*┋ •> 📝 Custom Words:*\n${wordList.split('\n').map(line => `*┋ •> ${line}*`).join('\n')}\n*┋*\n*┋ •> 📊 Total: ${words.length} words\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
    else {
        await sock.sendMessage(chatId, { 
            text: `❌ *Invalid option!*\n\nUse: ${prefix}antibadword <on/off/action/add/remove/list>`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
}

// Export default
export default {
    getAntiBadwordSettings,
    saveAntiBadwordSettings,
    addBadwordWarn,
    resetBadwordWarns,
    getBadwordWarnCount,
    handleAntiBadword,
    handleAntiBadwordCommand
};
