// ============================================
// SILA ANTI-LINK - Link Detection System
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

// Store anti-link status for each group
const antiLinkStatus = new Map();

// List of patterns to detect WhatsApp group links
const GROUP_LINK_PATTERNS = [
    /chat\.whatsapp\.com\/([A-Za-z0-9]{20,})/i,
    /whatsapp\.com\/accept\?code=[A-Za-z0-9]+/i,
    /wa\.me\/join\/([A-Za-z0-9]+)/i,
    /https?:\/\/(www\.)?chat\.whatsapp\.com\//i,
    /https?:\/\/(www\.)?whatsapp\.com\/channel\//i,
    /https?:\/\/(www\.)?whatsapp\.com\/group\//i
];

// ============ FILE OPERATIONS ============
function getStatusFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antilink.json');
}

function getWarningsFile() {
    return path.join(ROOT_DIR, 'tyrexmd', 'database', 'antilink_warnings.json');
}

// ============ SETTINGS MANAGEMENT ============
export async function getAntiLinkStatus(groupId) {
    const statusFile = getStatusFile();
    try {
        if (fs.existsSync(statusFile)) {
            const data = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
            return data[groupId] || false;
        }
    } catch (error) {}
    return antiLinkStatus.get(groupId) || false;
}

export async function setAntiLinkStatus(groupId, status) {
    antiLinkStatus.set(groupId, status);
    const statusFile = getStatusFile();
    try {
        let data = {};
        if (fs.existsSync(statusFile)) {
            data = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        }
        data[groupId] = status;
        fs.writeFileSync(statusFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) { return false; }
}

// ============ WARNINGS MANAGEMENT ============
export async function addAntiLinkWarn(groupId, userId) {
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

export async function resetAntiLinkWarns(groupId, userId) {
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

// ============ LINK DETECTION ============
export function containsGroupLink(text) {
    if (!text) return false;
    for (const pattern of GROUP_LINK_PATTERNS) {
        if (pattern.test(text)) return true;
    }
    return false;
}

// ============ MAIN HANDLER ============
export async function handleAntiLink(sock, msg, chatId, senderJid, linkText, botName, botFont) {
    try {
        const antiLinkEnabled = await getAntiLinkStatus(chatId);
        if (!antiLinkEnabled) return false;
        
        // Delete the message
        try {
            await sock.sendMessage(chatId, { delete: msg.key });
        } catch (e) {}
        
        const warningCount = await addAntiLinkWarn(chatId, senderJid);
        const styledName = applyFont(botName, botFont);
        
        await sock.sendMessage(chatId, {
            text: `*╭┈┈┄⊰ ${styledName} - ANTI LINK ⊱┄┄┄◈*\n\n*┋ •> ⚠️ @${senderJid.split('@')[0]} sent a link!*\n*┋ •> 📛 Warning #${warningCount}*\n*┋ •> 🔒 Link deleted*\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        });
        
        if (warningCount >= 3) {
            const adminStatus = await isAdmin(sock, chatId, senderJid);
            if (!adminStatus.isSenderAdmin) {
                await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
                await resetAntiLinkWarns(chatId, senderJid);
                await sock.sendMessage(chatId, {
                    text: `🚫 @${senderJid.split('@')[0]} KICKED for sending links!`,
                    mentions: [senderJid]
                });
            }
        }
        return true;
    } catch (error) {
        console.error('Anti-link error:', error);
        return false;
    }
}

// ============ COMMAND HANDLER ============
export async function handleAntiLinkCommand(sock, msg, args, prefix, chatId, senderJid, botName, botFont) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '❌ *This command can only be used in groups!*',
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    const adminStatus = await isAdmin(sock, chatId, senderJid);
    const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
    
    if (!adminStatus.isSenderAdmin && !isOwner) {
        await sock.sendMessage(chatId, { 
            text: '❌ *Only group admins or bot owner can use this command!*',
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    if (!adminStatus.isBotAdmin) {
        await sock.sendMessage(chatId, { 
            text: '❌ *Bot needs to be admin to delete messages!*',
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    const currentStatus = await getAntiLinkStatus(chatId);
    
    if (!args[0]) {
        const styledName = applyFont(botName, botFont);
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ ${styledName} - ANTILINK ⊱┄┄┄◈*\n\n*┋ •> 🔒 Status:* ${currentStatus ? '✅ ENABLED' : '❌ DISABLED'}\n*┋*\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}antilink on* - Enable\n*┋ •> ${prefix}antilink off* - Disable\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*\n${getFooter()}`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
        return;
    }
    
    const action = args[0].toLowerCase();
    if (action === 'on') {
        await setAntiLinkStatus(chatId, true);
        await sock.sendMessage(chatId, { 
            text: `🔒 *Anti-link ENABLED* in this group!\n⚠️ WhatsApp group links will be deleted.`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else if (action === 'off') {
        await setAntiLinkStatus(chatId, false);
        await sock.sendMessage(chatId, { 
            text: `🔓 *Anti-link DISABLED* in this group!\n✅ Links are now allowed.`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { 
            text: `❌ *Invalid option!*\n\nUse: ${prefix}antilink on/off`,
            contextInfo: { mentionedJid: [senderJid] }
        }, { quoted: msg });
    }
}

export default {
    getAntiLinkStatus,
    setAntiLinkStatus,
    addAntiLinkWarn,
    resetAntiLinkWarns,
    containsGroupLink,
    handleAntiLink,
    handleAntiLinkCommand
};
