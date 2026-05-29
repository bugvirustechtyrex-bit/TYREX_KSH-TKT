// ============================================
// TIMER COMMAND - Set group open/close after time
// Usage: .timer open 10m (fungua baada ya dakika 10)
//        .timer close 2h (funga baada ya masaa 2)
//        .timer open 3d (fungua baada ya siku 3)
// Powered by Tyrex KSH Tech
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TIMER_FILE = path.join(__dirname, '../../database', 'timers.json');

// Load timers
function loadTimers() {
    try {
        if (fs.existsSync(TIMER_FILE)) {
            return JSON.parse(fs.readFileSync(TIMER_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

// Save timers
function saveTimers(data) {
    try {
        const dir = path.dirname(TIMER_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TIMER_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {}
    return false;
}

// Parse time string (e.g., "10m", "2h", "3d", "1M")
function parseTime(timeStr) {
    const match = timeStr.match(/^(\d+)([mhdM])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch(unit) {
        case 'm': // minutes
            return { milliseconds: value * 60 * 1000, seconds: value * 60, unit: 'minutes', value: value };
        case 'h': // hours
            return { milliseconds: value * 60 * 60 * 1000, seconds: value * 60 * 60, unit: 'hours', value: value };
        case 'd': // days
            return { milliseconds: value * 24 * 60 * 60 * 1000, seconds: value * 24 * 60 * 60, unit: 'days', value: value };
        case 'M': // months (approx 30 days)
            return { milliseconds: value * 30 * 24 * 60 * 60 * 1000, seconds: value * 30 * 24 * 60 * 60, unit: 'months', value: value };
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
    
    if (months > 0) return `${months} month(s) ${days % 30} day(s)`;
    if (days > 0) return `${days} day(s) ${hours % 24} hour(s)`;
    if (hours > 0) return `${hours} hour(s) ${minutes % 60} minute(s)`;
    if (minutes > 0) return `${minutes} minute(s) ${seconds % 60} second(s)`;
    return `${seconds} second(s)`;
}

// Execute timer action
async function executeTimer(sock, chatId, action, timerData) {
    try {
        const groupMeta = await sock.groupMetadata(chatId);
        const currentSetting = groupMeta.announce;
        
        if (action === 'open' && currentSetting === true) {
            await sock.groupSettingUpdate(chatId, 'not_announcement');
            await sock.sendMessage(chatId, {
                text: `🔓 *GROUP OPENED*\n\n⏰ Timer completed!\n📅 Set: ${timerData.setTime}\n🎯 Duration: ${timerData.duration}`
            });
            console.log(`[TIMER] Opened group ${chatId}`);
        } 
        else if (action === 'close' && currentSetting === false) {
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, {
                text: `🔒 *GROUP CLOSED*\n\n⏰ Timer completed!\n📅 Set: ${timerData.setTime}\n🎯 Duration: ${timerData.duration}`
            });
            console.log(`[TIMER] Closed group ${chatId}`);
        }
    } catch (e) {
        console.error(`Timer error for ${chatId}:`, e.message);
    }
}

// Start timer checker
let checkerStarted = false;
let globalSock = null;

export function startTimerChecker(sock) {
    if (checkerStarted) return;
    globalSock = sock;
    checkerStarted = true;
    console.log('⏰ Timer checker STARTED (checks every 10 seconds)');
    
    setInterval(async () => {
        const timers = loadTimers();
        const now = Date.now();
        let changed = false;
        
        for (const [chatId, timer] of Object.entries(timers)) {
            if (timer.executeAt <= now) {
                // Execute timer
                await executeTimer(globalSock, chatId, timer.action, timer);
                // Delete timer
                delete timers[chatId];
                changed = true;
            }
        }
        
        if (changed) {
            saveTimers(timers);
        }
    }, 10000); // Check every 10 seconds
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
        
        const action = args[0]?.toLowerCase();
        const timeStr = args[1];
        
        // Show active timers
        if (!action || action === 'list') {
            const timers = loadTimers();
            const activeTimer = timers[chatId];
            
            if (!activeTimer) {
                await sock.sendMessage(chatId, {
                    text: `⏰ *ACTIVE TIMERS*\n\nNo active timer for this group.\n\n📝 *Usage:*\n${prefix}timer open 10m - Open after 10 minutes\n${prefix}timer close 2h - Close after 2 hours\n${prefix}timer open 3d - Open after 3 days\n${prefix}timer close 1M - Close after 1 month\n${prefix}timer cancel - Cancel timer\n\n📌 *Units:* m=minutes, h=hours, d=days, M=months`
                }, { quoted: msg });
                return;
            }
            
            const remaining = activeTimer.executeAt - Date.now();
            const remainingText = formatRemainingTime(remaining);
            
            await sock.sendMessage(chatId, {
                text: `⏰ *ACTIVE TIMER*\n\n🎯 Action: ${activeTimer.action === 'open' ? '🔓 OPEN' : '🔒 CLOSE'}\n⏱️ Duration: ${activeTimer.duration}\n📅 Set at: ${activeTimer.setTime}\n⏳ Remaining: ${remainingText}\n\n⚡ Will execute automatically!`
            }, { quoted: msg });
            return;
        }
        
        // Cancel timer
        if (action === 'cancel' || action === 'stop' || action === 'del') {
            const timers = loadTimers();
            if (timers[chatId]) {
                delete timers[chatId];
                saveTimers(timers);
                await sock.sendMessage(chatId, { text: '✅ Timer cancelled successfully!' }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: '❌ No active timer found!' }, { quoted: msg });
            }
            return;
        }
        
        // Set timer (open or close)
        if (action !== 'open' && action !== 'close') {
            await sock.sendMessage(chatId, {
                text: `📝 *Invalid action!*\n\nUse: ${prefix}timer open 10m\nOr: ${prefix}timer close 2h\n\n📌 *Examples:*\n${prefix}timer open 5m (open after 5 minutes)\n${prefix}timer close 3h (close after 3 hours)\n${prefix}timer open 2d (open after 2 days)\n${prefix}timer close 1M (close after 1 month)`
            }, { quoted: msg });
            return;
        }
        
        // Check time parameter
        if (!timeStr) {
            await sock.sendMessage(chatId, {
                text: `📝 *Usage:* ${prefix}timer ${action} <time>\n\n📌 *Examples:*\n${prefix}timer ${action} 10m (minutes)\n${prefix}timer ${action} 2h (hours)\n${prefix}timer ${action} 3d (days)\n${prefix}timer ${action} 1M (months)`
            }, { quoted: msg });
            return;
        }
        
        // Parse time
        const parsed = parseTime(timeStr);
        if (!parsed) {
            await sock.sendMessage(chatId, {
                text: `❌ Invalid time format!\n\n✅ Use:\n10m = 10 minutes\n2h = 2 hours\n3d = 3 days\n1M = 1 month\n\n📌 *Example:* ${prefix}timer ${action} 10m`
            }, { quoted: msg });
            return;
        }
        
        // Check if already has timer
        const timers = loadTimers();
        if (timers[chatId]) {
            const existing = timers[chatId];
            await sock.sendMessage(chatId, {
                text: `⚠️ *Timer already exists!*\n\nCurrent: ${existing.action === 'open' ? '🔓 OPEN' : '🔒 CLOSE'} in ${existing.duration}\n\nUse ${prefix}timer cancel first to set new timer.`
            }, { quoted: msg });
            return;
        }
        
        // Check current group state
        const currentSetting = groupMeta.announce;
        const currentState = currentSetting ? 'CLOSED' : 'OPEN';
        
        if ((action === 'open' && !currentSetting) || (action === 'close' && currentSetting)) {
            await sock.sendMessage(chatId, {
                text: `⚠️ *Group is already ${currentState}!*\n\nNo need to ${action} the group.\n\nUse ${prefix}timer ${action === 'open' ? 'close' : 'open'} if you want to change.`
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
        
        // Format execution time
        const execTime = new Date(executeAt).toLocaleString();
        
        await sock.sendMessage(chatId, {
            text: `✅ *TIMER SET!*\n\n🎯 Action: ${action === 'open' ? '🔓 OPEN GROUP' : '🔒 CLOSE GROUP'}\n⏱️ Duration: ${duration}\n📅 Set at: ${setTime}\n⏰ Will execute: ${execTime}\n⏳ Remaining: ${parsed.seconds} seconds\n\n⚡ Bot will auto ${action} the group!`
        }, { quoted: msg });
        
        // Start checker if not started
        if (!checkerStarted) {
            startTimerChecker(sock);
        }
    }
};
