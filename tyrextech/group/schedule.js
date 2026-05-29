// ============================================
// SCHEDULE COMMAND - Auto open/close group
// Fixed time validation
// Powered by Tyrex KSH Tech
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEDULE_FILE = path.join(__dirname, '../../database', 'schedule.json');

// Function to load schedules
function loadSchedules() {
    try {
        if (fs.existsSync(SCHEDULE_FILE)) {
            const data = fs.readFileSync(SCHEDULE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Load error:', e);
    }
    return {};
}

// Function to save schedules
function saveSchedules(data) {
    try {
        const dir = path.dirname(SCHEDULE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('Save error:', e);
        return false;
    }
}

// Function to validate time
function isValidTime(time) {
    // Check format HH:MM
    if (!time || time.length !== 5) return false;
    if (time[2] !== ':') return false;
    
    const hours = parseInt(time.substring(0, 2));
    const minutes = parseInt(time.substring(3, 5));
    
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (hours < 0 || hours > 23) return false;
    if (minutes < 0 || minutes > 59) return false;
    
    return true;
}

export default {
    name: 'schedule',
    description: 'Set group auto open/close time',
    category: 'group',
    alias: ['sch', 'jadwal', 'timer'],
    
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
        
        const cmd = args[0]?.toLowerCase();
        const schedules = loadSchedules();
        
        // ========== INFO ==========
        if (!cmd || cmd === 'info') {
            const data = schedules[chatId];
            if (!data || !data.open) {
                await sock.sendMessage(chatId, {
                    text: `📅 *GROUP SCHEDULE*\n\nNo schedule set.\n\n📝 *Commands:*\n${prefix}schedule set 08:00 17:00\n${prefix}schedule enable\n${prefix}schedule disable\n${prefix}schedule delete\n\n📌 *Example:*\n${prefix}schedule set 08:00 17:00`
                }, { quoted: msg });
                return;
            }
            
            const status = data.enabled ? '✅ ENABLED' : '❌ DISABLED';
            await sock.sendMessage(chatId, {
                text: `━━━━━━━━━━━━━━━━━━\n     📅 *SCHEDULE INFO* 📅\n━━━━━━━━━━━━━━━━━━\n\n📊 Status: ${status}\n🔓 Open: ${data.open}\n🔒 Close: ${data.close}\n━━━━━━━━━━━━━━━━━━`
            }, { quoted: msg });
            return;
        }
        
        // ========== SET ==========
        if (cmd === 'set') {
            const openTime = args[1];
            const closeTime = args[2];
            
            if (!openTime || !closeTime) {
                await sock.sendMessage(chatId, {
                    text: `📝 *Usage:* ${prefix}schedule set 08:00 17:00\n\n📌 *Example:* ${prefix}schedule set 08:00 17:00`
                }, { quoted: msg });
                return;
            }
            
            // Validate time format
            if (!isValidTime(openTime)) {
                await sock.sendMessage(chatId, { text: `❌ Invalid open time: "${openTime}"\n✅ Use format: 08:00 or 17:30` }, { quoted: msg });
                return;
            }
            
            if (!isValidTime(closeTime)) {
                await sock.sendMessage(chatId, { text: `❌ Invalid close time: "${closeTime}"\n✅ Use format: 08:00 or 17:30` }, { quoted: msg });
                return;
            }
            
            schedules[chatId] = {
                open: openTime,
                close: closeTime,
                enabled: true
            };
            saveSchedules(schedules);
            
            await sock.sendMessage(chatId, {
                text: `✅ *Schedule Set!*\n\n🔓 Open: ${openTime}\n🔒 Close: ${closeTime}\n\n⚡ Auto schedule ENABLED`
            }, { quoted: msg });
            
            // Apply immediately
            await checkAndApply(sock, chatId, schedules[chatId]);
            return;
        }
        
        // ========== ENABLE ==========
        if (cmd === 'enable') {
            if (!schedules[chatId] || !schedules[chatId].open) {
                await sock.sendMessage(chatId, { text: '❌ No schedule set! Use .schedule set first' }, { quoted: msg });
                return;
            }
            schedules[chatId].enabled = true;
            saveSchedules(schedules);
            await sock.sendMessage(chatId, { text: '✅ Schedule ENABLED - Group will auto open/close' }, { quoted: msg });
            await checkAndApply(sock, chatId, schedules[chatId]);
            return;
        }
        
        // ========== DISABLE ==========
        if (cmd === 'disable') {
            if (!schedules[chatId]) {
                await sock.sendMessage(chatId, { text: '❌ No schedule found!' }, { quoted: msg });
                return;
            }
            schedules[chatId].enabled = false;
            saveSchedules(schedules);
            await sock.sendMessage(chatId, { text: '❌ Schedule DISABLED - Group will NOT auto manage' }, { quoted: msg });
            return;
        }
        
        // ========== DELETE ==========
        if (cmd === 'delete' || cmd === 'del' || cmd === 'clear') {
            delete schedules[chatId];
            saveSchedules(schedules);
            await sock.sendMessage(chatId, { text: '✅ Schedule DELETED!' }, { quoted: msg });
            return;
        }
        
        // ========== HELP ==========
        await sock.sendMessage(chatId, {
            text: `📅 *SCHEDULE COMMANDS*\n\n${prefix}schedule info - Show schedule\n${prefix}schedule set 08:00 17:00 - Set time\n${prefix}schedule enable - Turn on\n${prefix}schedule disable - Turn off\n${prefix}schedule delete - Remove schedule\n\n📌 *Example:* ${prefix}schedule set 08:00 17:00`
        }, { quoted: msg });
    }
};

// Function to check and apply schedule
async function checkAndApply(sock, chatId, schedule) {
    if (!schedule || !schedule.enabled) return;
    
    try {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const shouldBeOpen = currentTime >= schedule.open && currentTime < schedule.close;
        const targetSetting = shouldBeOpen ? 'not_announcement' : 'announcement';
        
        const groupMeta = await sock.groupMetadata(chatId);
        if (groupMeta.announce !== targetSetting) {
            await sock.groupSettingUpdate(chatId, targetSetting);
            console.log(`[${chatId}] ${shouldBeOpen ? 'OPENED' : 'CLOSED'} at ${currentTime}`);
        }
    } catch (e) {
        console.error('Apply error:', e.message);
    }
}

// Auto checker - call this from your main file
export function startAutoChecker(sock) {
    console.log('⏰ Auto schedule checker started (checks every minute)');
    
    setInterval(async () => {
        const schedules = loadSchedules();
        for (const [chatId, schedule] of Object.entries(schedules)) {
            if (schedule.enabled) {
                await checkAndApply(sock, chatId, schedule);
            }
        }
    }, 60000); // Check every minute
}
