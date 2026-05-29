// ============================================
// TIMER COMMAND - Fixed version with better checking
// Powered by Tyrex KSH Tech
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TIMER_FILE = path.join(__dirname, '../../database', 'timers.json');

// Global variables
let globalSock = null;
let checkerInterval = null;

// Load timers
function loadTimers() {
    try {
        if (fs.existsSync(TIMER_FILE)) {
            return JSON.parse(fs.readFileSync(TIMER_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Load timer error:', e);
    }
    return {};
}

// Save timers
function saveTimers(data) {
    try {
        const dir = path.dirname(TIMER_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TIMER_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Save timer error:', e);
    }
    return false;
}

// Parse time string
function parseTime(timeStr) {
    const match = timeStr.match(/^(\d+)([mhdM])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch(unit) {
        case 'm':
            return { milliseconds: value * 60 * 1000, seconds: value * 60, unit: 'minute(s)', value: value };
        case 'h':
            return { milliseconds: value * 60 * 60 * 1000, seconds: value * 60 * 60, unit: 'hour(s)', value: value };
        case 'd':
            return { milliseconds: value * 24 * 60 * 60 * 1000, seconds: value * 24 * 60 * 60, unit: 'day(s)', value: value };
        case 'M':
            return { milliseconds: value * 30 * 24 * 60 * 60 * 1000, seconds: value * 30 * 24 * 60 * 60, unit: 'month(s)', value: value };
        default:
            return null;
    }
}

// Format remaining time
function formatRemainingTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    
    if (months > 0) return `${months}M ${days % 30}d`;
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Execute timer action
async function executeTimer(chatId, action, timerData) {
    if (!globalSock) {
        console.log('❌ No sock instance');
        return;
    }
    
    try {
        // Check if group exists and bot is admin
        const groupMeta = await globalSock.groupMetadata(chatId);
        const botNumber = globalSock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMeta.participants.some(p => p.id === botNumber && p.admin);
        
        if (!isBotAdmin) {
            console.log(`❌ Bot is not admin in ${chatId}`);
            await globalSock.sendMessage(chatId, {
                text: `❌ *TIMER FAILED*\n\nI need to be ADMIN to ${action} the group!\n\nPlease make me admin first.`
            });
            return;
        }
        
        const currentSetting = groupMeta.announce; // true = closed, false = open
        
        if (action === 'open' && currentSetting === true) {
            await globalSock.groupSettingUpdate(chatId, 'not_announcement');
            await globalSock.sendMessage(chatId, {
                text: `🔓 *GROUP OPENED*\n\n⏰ Timer completed!\n📅 Duration: ${timerData.duration}\n✅ All members can now send messages.`
            });
            console.log(`✅ [TIMER] Opened group ${chatId}`);
        } 
        else if (action === 'close' && currentSetting === false) {
            await globalSock.groupSettingUpdate(chatId, 'announcement');
            await globalSock.sendMessage(chatId, {
                text: `🔒 *GROUP CLOSED*\n\n⏰ Timer completed!\n📅 Duration: ${timerData.duration}\n❌ Only admins can send messages now.`
            });
            console.log(`✅ [TIMER] Closed group ${chatId}`);
        }
        else {
            console.log(`⚠️ [TIMER] Group already ${action === 'open' ? 'open' : 'closed'} in ${chatId}`);
            await globalSock.sendMessage(chatId, {
                text: `⚠️ *TIMER NOTICE*\n\nGroup is already ${currentSetting ? 'CLOSED' : 'OPEN'}!\nNo action needed.`
            });
        }
    } catch (e) {
        console.error(`Timer execution error for ${chatId}:`, e.message);
        if (globalSock) {
            try {
                await globalSock.sendMessage(chatId, {
                    text: `❌ *TIMER ERROR*\n\nFailed to ${action} group.\nError: ${e.message}`
                });
            } catch (err) {}
        }
    }
}

// Start timer checker
export function startTimerChecker(sock) {
    if (checkerInterval) {
        clearInterval(checkerInterval);
    }
    
    globalSock = sock;
    console.log('⏰ TIMER CHECKER STARTED (checks every 10 seconds)');
    
    // Check immediately
    setTimeout(() => checkTimers(), 1000);
    
    // Set interval
    checkerInterval = setInterval(() => checkTimers(), 10000);
}

async function checkTimers() {
    if (!globalSock) return;
    
    const timers = loadTimers();
    const now = Date.now();
    let changed = false;
    
    for (const [chatId, timer] of Object.entries(timers)) {
        if (timer.executeAt <= now) {
            console.log(`⏰ Executing timer for ${chatId} at ${new Date().toLocaleString()}`);
            await executeTimer(chatId, timer.action, timer);
            delete timers[chatId];
            changed = true;
        }
    }
    
    if (changed) {
        saveTimers(timers);
    }
}

// Stop timer checker
export function stopTimerChecker() {
    if (checkerInterval) {
        clearInterval(checkerInterval);
        checkerInterval = null;
        console.log('⏰ Timer checker stopped');
    }
}

export default {
    name: 'timer',
    description: 'Set group to open/close after time',
    category: 'group',
    alias: ['timers', 'countdown', 'cd'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        
        // Check if group
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ Group command only!' }, { quoted: msg });
            return;
        }
        
        // Check if admin
        const groupMeta = await sock.groupMetadata(chatId);
        const isAdmin = groupMeta.participants.some(p => p.id === sender && p.admin);
        
        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Admin only!' }, { quoted: msg });
            return;
        }
        
        // Check if bot is admin (important!)
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMeta.participants.some(p => p.id === botNumber && p.admin);
        
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { 
                text: '❌ *BOT NEEDS TO BE ADMIN!*\n\nPlease make me admin first to use timer commands.\n\nAdmin rights needed to open/close group.'
            }, { quoted: msg });
            return;
        }
        
        const action = args[0]?.toLowerCase();
        const timeStr = args[1];
        
        // Show active timers
        if (!action || action === 'list' || action === 'info') {
            const timers = loadTimers();
            const activeTimer = timers[chatId];
            
            if (!activeTimer) {
                await sock.sendMessage(chatId, {
                    text: `⏰ *TIMER COMMANDS*\n\n📝 *Usage:*\n${prefix}timer open 5m - Open after 5 minutes\n${prefix}timer close 2h - Close after 2 hours\n${prefix}timer open 3d - Open after 3 days\n${prefix}timer close 1M - Close after 1 month\n${prefix}timer cancel - Cancel timer\n\n📌 *Units:*\nm = minutes\nh = hours\nd = days\nM = months\n\n✅ Bot is ADMIN - Ready to use!`
                }, { quoted: msg });
                return;
            }
            
            const remaining = activeTimer.executeAt - Date.now();
            const remainingText = formatRemainingTime(remaining);
            const execTime = new Date(activeTimer.executeAt).toLocaleString();
            
            await sock.sendMessage(chatId, {
                text: `⏰ *ACTIVE TIMER*\n\n🎯 Action: ${activeTimer.action === 'open' ? '🔓 OPEN GROUP' : '🔒 CLOSE GROUP'}\n⏱️ Duration: ${activeTimer.duration}\n📅 Set at: ${activeTimer.setTime}\n⏰ Execute at: ${execTime}\n⏳ Remaining: ${remainingText}\n\n⚡ Bot will auto-execute when time is up!`
            }, { quoted: msg });
            return;
        }
        
        // Cancel timer
        if (action === 'cancel' || action === 'stop' || action === 'delete') {
            const timers = loadTimers();
            if (timers[chatId]) {
                const timer = timers[chatId];
                delete timers[chatId];
                saveTimers(timers);
                await sock.sendMessage(chatId, { 
                    text: `✅ *Timer Cancelled!*\n\n${timer.action === 'open' ? '🔓 OPEN' : '🔒 CLOSE'} timer cancelled successfully.`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: '❌ No active timer found!' }, { quoted: msg });
            }
            return;
        }
        
        // Set timer
        if (action !== 'open' && action !== 'close') {
            await sock.sendMessage(chatId, {
                text: `📝 *Invalid action!*\n\nUse: ${prefix}timer open 5m\nOr: ${prefix}timer close 2h\n\n📌 *Examples:*\n${prefix}timer open 5m (open after 5 minutes)\n${prefix}timer close 3h (close after 3 hours)`
            }, { quoted: msg });
            return;
        }
        
        // Check time parameter
        if (!timeStr) {
            await sock.sendMessage(chatId, {
                text: `📝 *Usage:* ${prefix}timer ${action} <time>\n\n📌 *Examples:*\n${prefix}timer ${action} 10m (minutes)\n${prefix}timer ${action} 2h (hours)\n${prefix}timer ${action} 3d (days)\n${prefix}timer ${action} 1M (months)\n\n🔍 *Current time:* ${new Date().toLocaleTimeString()}`
            }, { quoted: msg });
            return;
        }
        
        // Parse time
        const parsed = parseTime(timeStr);
        if (!parsed) {
            await sock.sendMessage(chatId, {
                text: `❌ *Invalid time format!*\n\n✅ Use:\n10m = 10 minutes\n2h = 2 hours\n3d = 3 days\n1M = 1 month\n\n📌 *Example:* ${prefix}timer ${action} 10m`
            }, { quoted: msg });
            return;
        }
        
        // Check if already has timer
        const timers = loadTimers();
        if (timers[chatId]) {
            const existing = timers[chatId];
            const remaining = formatRemainingTime(existing.executeAt - Date.now());
            await sock.sendMessage(chatId, {
                text: `⚠️ *Timer already exists!*\n\nCurrent: ${existing.action === 'open' ? '🔓 OPEN' : '🔒 CLOSE'} in ${existing.duration}\nRemaining: ${remaining}\n\nUse ${prefix}timer cancel first to set new timer.`
            }, { quoted: msg });
            return;
        }
        
        // Check current group state
        const currentSetting = groupMeta.announce;
        const currentState = currentSetting ? 'CLOSED' : 'OPEN';
        
        if ((action === 'open' && !currentSetting) || (action === 'close' && currentSetting)) {
            await sock.sendMessage(chatId, {
                text: `⚠️ *Group is already ${currentState}!*\n\nNo need to ${action} the group.\n\nUse ${prefix}timer ${action === 'open' ? 'close' : 'open'} ${timeStr} if you want to change.`
            }, { quoted: msg });
            return;
        }
        
        // Create timer
        const executeAt = Date.now() + parsed.milliseconds;
        const setTime = new Date().toLocaleString();
        const duration = `${parsed.value} ${parsed.unit}`;
        
        timers[chatId] = {
            action: action,
            duration: duration,
            setTime: setTime,
            executeAt: executeAt,
            createdAt: Date.now()
        };
        saveTimers(timers);
        
        const execTime = new Date(executeAt).toLocaleString();
        
        await sock.sendMessage(chatId, {
            text: `✅ *TIMER SET!*\n\n🎯 Action: ${action === 'open' ? '🔓 OPEN GROUP' : '🔒 CLOSE GROUP'}\n⏱️ Duration: ${duration}\n📅 Set at: ${setTime}\n⏰ Will execute: ${execTime}\n\n⚡ Bot will auto ${action} the group!\n✅ Bot is admin - Ready to execute!`
        }, { quoted: msg });
        
        // Start checker if not started
        if (!checkerInterval) {
            startTimerChecker(sock);
        }
    }
};
