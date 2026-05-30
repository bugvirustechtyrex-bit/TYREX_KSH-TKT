// ============================================
// TIMER COMMAND - Notify version (No admin needed)
// Bot sends reminder instead of auto action
// Powered by Tyrex KSH Tech
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TIMER_FILE = path.join(__dirname, '../../database', 'timers.json');

let globalSock = null;
let checkerInterval = null;

function loadTimers() {
    try {
        if (fs.existsSync(TIMER_FILE)) {
            return JSON.parse(fs.readFileSync(TIMER_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveTimers(data) {
    try {
        const dir = path.dirname(TIMER_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TIMER_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {}
    return false;
}

function parseTime(timeStr) {
    const match = timeStr.match(/^(\d+)([mhdM])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch(unit) {
        case 'm': return { milliseconds: value * 60 * 1000, seconds: value * 60, unit: 'minute(s)', value: value };
        case 'h': return { milliseconds: value * 60 * 60 * 1000, seconds: value * 60 * 60, unit: 'hour(s)', value: value };
        case 'd': return { milliseconds: value * 24 * 60 * 60 * 1000, seconds: value * 24 * 60 * 60, unit: 'day(s)', value: value };
        case 'M': return { milliseconds: value * 30 * 24 * 60 * 60 * 1000, seconds: value * 30 * 24 * 60 * 60, unit: 'month(s)', value: value };
        default: return null;
    }
}

function formatRemainingTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

export function startTimerChecker(sock) {
    if (checkerInterval) clearInterval(checkerInterval);
    globalSock = sock;
    console.log('⏰ TIMER CHECKER STARTED (Notify mode)');
    
    checkerInterval = setInterval(async () => {
        const timers = loadTimers();
        const now = Date.now();
        let changed = false;
        
        for (const [chatId, timer] of Object.entries(timers)) {
            if (timer.executeAt <= now) {
                console.log(`⏰ Timer triggered for ${chatId}`);
                
                // Send reminder to group
                try {
                    await globalSock.sendMessage(chatId, {
                        text: `⏰ *TIMER REMINDER*\n\n🎯 Action: ${timer.action === 'open' ? '🔓 OPEN GROUP' : '🔒 CLOSE GROUP'}\n⏱️ Duration: ${timer.duration}\n📅 Set by: @${timer.setBy}\n\n⚠️ *Please ask an admin to ${timer.action} the group manually!*\n\n💡 Bot needs admin rights to auto-${timer.action}.`,
                        mentions: [timer.setByJid]
                    });
                } catch (e) {}
                
                delete timers[chatId];
                changed = true;
            }
        }
        
        if (changed) saveTimers(timers);
    }, 10000);
}

export default {
    name: 'timer',
    description: 'Set reminder to open/close group after time',
    category: 'group',
    alias: ['timers', 'remind'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        const senderNumber = sender.split('@')[0];
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ Group command only!' }, { quoted: msg });
            return;
        }
        
        // Check if sender is admin
        const groupMeta = await sock.groupMetadata(chatId);
        const isAdmin = groupMeta.participants.some(p => p.id === sender && p.admin);
        
        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Only admins can set timers!' }, { quoted: msg });
            return;
        }
        
        const action = args[0]?.toLowerCase();
        const timeStr = args[1];
        
        // Show timers
        if (!action || action === 'list') {
            const timers = loadTimers();
            const activeTimer = timers[chatId];
            
            if (!activeTimer) {
                await sock.sendMessage(chatId, {
                    text: `⏰ *TIMER COMMANDS*\n\n📝 *Usage:*\n${prefix}timer open 5m - Remind to open after 5 min\n${prefix}timer close 2h - Remind to close after 2h\n${prefix}timer cancel - Cancel timer\n\n📌 *Units:* m=minutes, h=hours, d=days, M=months\n\n⚠️ Bot will send reminder only (needs manual action)`
                }, { quoted: msg });
                return;
            }
            
            const remaining = activeTimer.executeAt - Date.now();
            await sock.sendMessage(chatId, {
                text: `⏰ *ACTIVE TIMER*\n\n🎯 Action: ${activeTimer.action === 'open' ? '🔓 OPEN' : '🔒 CLOSE'}\n⏱️ Duration: ${activeTimer.duration}\n⏳ Remaining: ${formatRemainingTime(remaining)}\n📅 Set by: @${activeTimer.setBy}\n\n⚡ Bot will remind when time is up!`,
                mentions: [activeTimer.setByJid]
            }, { quoted: msg });
            return;
        }
        
        // Cancel timer
        if (action === 'cancel') {
            const timers = loadTimers();
            if (timers[chatId]) {
                delete timers[chatId];
                saveTimers(timers);
                await sock.sendMessage(chatId, { text: '✅ Timer cancelled!' }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: '❌ No active timer!' }, { quoted: msg });
            }
            return;
        }
        
        // Set timer
        if (action !== 'open' && action !== 'close') {
            await sock.sendMessage(chatId, {
                text: `📝 *Usage:* ${prefix}timer open 5m or ${prefix}timer close 2h`
            }, { quoted: msg });
            return;
        }
        
        if (!timeStr) {
            await sock.sendMessage(chatId, {
                text: `📝 *Example:* ${prefix}timer ${action} 10m\n\nUnits: 10m (min), 2h (hours), 3d (days), 1M (months)`
            }, { quoted: msg });
            return;
        }
        
        const parsed = parseTime(timeStr);
        if (!parsed) {
            await sock.sendMessage(chatId, { text: '❌ Invalid time! Use: 10m, 2h, 3d, 1M' }, { quoted: msg });
            return;
        }
        
        const timers = loadTimers();
        if (timers[chatId]) {
            await sock.sendMessage(chatId, { text: '⚠️ Timer exists! Use .timer cancel first' }, { quoted: msg });
            return;
        }
        
        // Create timer
        timers[chatId] = {
            action: action,
            duration: `${parsed.value} ${parsed.unit}`,
            setBy: senderNumber,
            setByJid: sender,
            setTime: new Date().toLocaleString(),
            executeAt: Date.now() + parsed.milliseconds
        };
        saveTimers(timers);
        
        const execTime = new Date(Date.now() + parsed.milliseconds).toLocaleString();
        
        await sock.sendMessage(chatId, {
            text: `✅ *TIMER SET!*\n\n🎯 Action: ${action === 'open' ? '🔓 OPEN GROUP' : '🔒 CLOSE GROUP'}\n⏱️ Duration: ${parsed.value} ${parsed.unit}\n⏰ Remind at: ${execTime}\n📅 Set by: @${senderNumber}\n\n⚡ Bot will remind you when time is up!\n⚠️ You need to ${action} the group manually.`,
            mentions: [sender]
        }, { quoted: msg });
        
        if (!checkerInterval) startTimerChecker(sock);
    }
};
