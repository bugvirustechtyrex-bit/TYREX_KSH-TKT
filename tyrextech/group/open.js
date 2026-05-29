// ============================================
// GROUP SCHEDULE - Auto open/close at specific times
// Set time for group to open and close automatically
// Powered by Tyrex KSH Tech
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToUrl(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEDULE_FILE = path.join(__dirname, '../database', 'group_schedules.json');

// Load schedules from file
function loadSchedules() {
    try {
        if (fs.existsSync(SCHEDULE_FILE)) {
            return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading schedules:', error);
    }
    return {};
}

// Save schedules to file
function saveSchedules(schedules) {
    try {
        const dir = path.dirname(SCHEDULE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedules, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving schedules:', error);
        return false;
    }
}

// Check and apply schedule
async function checkAndApplySchedule(sock, chatId, schedules) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();
    
    const groupSchedule = schedules[chatId];
    if (!groupSchedule || !groupSchedule.enabled) return;
    
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const currentSetting = groupMetadata.announce;
        
        let shouldBeOpen = false;
        
        // Check all schedules for today
        for (const schedule of groupSchedule.schedules) {
            if (schedule.days.includes(currentDay)) {
                const openTime = schedule.openHour * 60 + schedule.openMinute;
                const closeTime = schedule.closeHour * 60 + schedule.closeMinute;
                
                if (openTime <= closeTime) {
                    // Normal schedule (e.g., 08:00 - 17:00)
                    if (currentTime >= openTime && currentTime < closeTime) {
                        shouldBeOpen = true;
                        break;
                    }
                } else {
                    // Overnight schedule (e.g., 22:00 - 06:00)
                    if (currentTime >= openTime || currentTime < closeTime) {
                        shouldBeOpen = true;
                        break;
                    }
                }
            }
        }
        
        // Apply setting if needed
        const targetSetting = shouldBeOpen ? 'not_announcement' : 'announcement';
        if (currentSetting !== targetSetting) {
            await sock.groupSettingUpdate(chatId, targetSetting);
            console.log(`[Schedule] ${chatId} ${shouldBeOpen ? 'Opened' : 'Closed'} at ${new Date().toLocaleTimeString()}`);
        }
    } catch (error) {
        console.error('Error applying schedule:', error);
    }
}

// Start schedule checker
let checkerInterval = null;
export function startScheduleChecker(sock) {
    if (checkerInterval) clearInterval(checkerInterval);
    
    checkerInterval = setInterval(async () => {
        const schedules = loadSchedules();
        const activeGroups = Object.keys(schedules);
        
        for (const chatId of activeGroups) {
            if (schedules[chatId]?.enabled) {
                await checkAndApplySchedule(sock, chatId, schedules);
            }
        }
    }, 60000); // Check every minute
}

export default {
    name: 'schedule',
    description: 'Set group auto open/close schedule',
    category: 'group',
    alias: ['sch', 'settime', 'groupschedule', 'jadwal'],
    
    async execute(sock, msg, args, prefix, config) {
        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || chatId;
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: "❌ This command is for groups only!" }, { quoted: msg });
            return;
        }
        
        // Check if admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && p.admin);
        
        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: "❌ Only admins can set group schedule!" }, { quoted: msg });
            return;
        }
        
        const subCommand = args[0]?.toLowerCase();
        
        // Show schedule info
        if (!subCommand || subCommand === 'info') {
            const schedules = loadSchedules();
            const groupSchedule = schedules[chatId];
            
            if (!groupSchedule || !groupSchedule.schedules?.length) {
                await sock.sendMessage(chatId, {
                    text: `📅 *Group Schedule*\n\nNo schedule set.\n\n📝 *Usage:*\n${prefix}schedule set <open_time> <close_time> <days>\n${prefix}schedule enable\n${prefix}schedule disable\n\n📌 *Example:*\n${prefix}schedule set 08:00 17:00 mon-fri\n${prefix}schedule set 22:00 06:00 sat-sun\n\n*Days format:* mon,tue,wed,thu,fri,sat,sun or mon-fri`
                }, { quoted: msg });
                return;
            }
            
            let infoText = `━━━━━━━━━━━━━━━━━━\n`;
            infoText += `     📅 *GROUP SCHEDULE* 📅\n`;
            infoText += `━━━━━━━━━━━━━━━━━━\n\n`;
            infoText += `📊 *Status:* ${groupSchedule.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n\n`;
            infoText += `⏰ *Schedule Times:*\n`;
            
            for (let i = 0; i < groupSchedule.schedules.length; i++) {
                const s = groupSchedule.schedules[i];
                const days = s.days.map(d => {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return dayNames[d];
                }).join(', ');
                
                infoText += `\n┋▸ Schedule ${i + 1}:\n`;
                infoText += `┋   🔓 Open: ${s.openHour.toString().padStart(2, '0')}:${s.openMinute.toString().padStart(2, '0')}\n`;
                infoText += `┋   🔒 Close: ${s.closeHour.toString().padStart(2, '0')}:${s.closeMinute.toString().padStart(2, '0')}\n`;
                infoText += `┋   📆 Days: ${days}\n`;
            }
            
            infoText += `\n━━━━━━━━━━━━━━━━━━\n`;
            infoText += `⚡ Group will ${groupSchedule.enabled ? 'automatically open/close' : 'NOT auto manage'} based on schedule.\n`;
            infoText += `━━━━━━━━━━━━━━━━━━`;
            
            await sock.sendMessage(chatId, { text: infoText }, { quoted: msg });
            return;
        }
        
        // Set schedule
        if (subCommand === 'set') {
            const openTime = args[1];
            const closeTime = args[2];
            const daysInput = args[3]?.toLowerCase();
            
            if (!openTime || !closeTime || !daysInput) {
                await sock.sendMessage(chatId, {
                    text: `📝 *Usage:* ${prefix}schedule set <open_time> <close_time> <days>\n\n📌 *Example:*\n${prefix}schedule set 08:00 17:00 mon-fri\n${prefix}schedule set 22:00 06:00 sat-sun\n\n*Days format:* mon,tue,wed,thu,fri,sat,sun or mon-fri or all`
                }, { quoted: msg });
                return;
            }
            
            // Parse times
            const openMatch = openTime.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
            const closeMatch = closeTime.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
            
            if (!openMatch || !closeMatch) {
                await sock.sendMessage(chatId, { text: "❌ Invalid time format! Use HH:MM (e.g., 08:00, 17:30)" }, { quoted: msg });
                return;
            }
            
            const openHour = parseInt(openMatch[1]);
            const openMinute = parseInt(openMatch[2]);
            const closeHour = parseInt(closeMatch[1]);
            const closeMinute = parseInt(closeMatch[2]);
            
            // Parse days
            let days = [];
            const dayMap = {
                'sun': 0, 'sunday': 0,
                'mon': 1, 'monday': 1,
                'tue': 2, 'tuesday': 2,
                'wed': 3, 'wednesday': 3,
                'thu': 4, 'thursday': 4,
                'fri': 5, 'friday': 5,
                'sat': 6, 'saturday': 6
            };
            
            if (daysInput === 'all') {
                days = [0, 1, 2, 3, 4, 5, 6];
            } else if (daysInput.includes('-')) {
                // Range like mon-fri
                const [start, end] = daysInput.split('-');
                let startNum = dayMap[start];
                let endNum = dayMap[end];
                if (startNum !== undefined && endNum !== undefined) {
                    for (let i = startNum; i <= endNum; i++) {
                        days.push(i);
                    }
                }
            } else {
                // Comma separated like mon,tue,wed
                const dayList = daysInput.split(',');
                for (const day of dayList) {
                    const num = dayMap[day.trim()];
                    if (num !== undefined) days.push(num);
                }
            }
            
            if (days.length === 0) {
                await sock.sendMessage(chatId, { text: "❌ Invalid days! Use: mon, tue, wed, thu, fri, sat, sun" }, { quoted: msg });
                return;
            }
            
            // Remove duplicates and sort
            days = [...new Set(days)].sort((a, b) => a - b);
            
            // Save schedule
            const schedules = loadSchedules();
            if (!schedules[chatId]) {
                schedules[chatId] = { schedules: [], enabled: true };
            }
            
            schedules[chatId].schedules.push({
                openHour, openMinute,
                closeHour, closeMinute,
                days: days
            });
            
            saveSchedules(schedules);
            
            const dayNames = days.map(d => {
                const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return names[d];
            }).join(', ');
            
            await sock.sendMessage(chatId, {
                text: `✅ *Schedule Added!*\n\n🔓 Open: ${openTime}\n🔒 Close: ${closeTime}\n📆 Days: ${dayNames}\n\n⚡ Schedule ${schedules[chatId].schedules.length} added successfully!`
            }, { quoted: msg });
            
            // Apply immediately
            await checkAndApplySchedule(sock, chatId, schedules);
            return;
        }
        
        // Remove schedule
        if (subCommand === 'remove' || subCommand === 'delete' || subCommand === 'rm') {
            const schedules = loadSchedules();
            if (!schedules[chatId] || !schedules[chatId].schedules.length) {
                await sock.sendMessage(chatId, { text: "❌ No schedule found for this group!" }, { quoted: msg });
                return;
            }
            
            const index = parseInt(args[1]) - 1;
            if (isNaN(index) || index < 0 || index >= schedules[chatId].schedules.length) {
                let text = `📝 *Usage:* ${prefix}schedule remove <number>\n\n`;
                text += `Current schedules:\n`;
                for (let i = 0; i < schedules[chatId].schedules.length; i++) {
                    const s = schedules[chatId].schedules[i];
                    text += `${i + 1}. ${s.openHour}:${s.openMinute.toString().padStart(2, '0')} - ${s.closeHour}:${s.closeMinute.toString().padStart(2, '0')}\n`;
                }
                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }
            
            schedules[chatId].schedules.splice(index, 1);
            if (schedules[chatId].schedules.length === 0) {
                delete schedules[chatId];
            }
            saveSchedules(schedules);
            
            await sock.sendMessage(chatId, { text: `✅ Schedule ${index + 1} removed successfully!` }, { quoted: msg });
            return;
        }
        
        // Enable/disable schedule
        if (subCommand === 'enable' || subCommand === 'on') {
            const schedules = loadSchedules();
            if (!schedules[chatId] || !schedules[chatId].schedules?.length) {
                await sock.sendMessage(chatId, { text: "❌ No schedule set! Use .schedule set first." }, { quoted: msg });
                return;
            }
            
            schedules[chatId].enabled = true;
            saveSchedules(schedules);
            await checkAndApplySchedule(sock, chatId, schedules);
            
            await sock.sendMessage(chatId, { text: "✅ Group schedule ENABLED! Group will auto open/close." }, { quoted: msg });
            return;
        }
        
        if (subCommand === 'disable' || subCommand === 'off') {
            const schedules = loadSchedules();
            if (!schedules[chatId]) {
                await sock.sendMessage(chatId, { text: "❌ No schedule found!" }, { quoted: msg });
                return;
            }
            
            schedules[chatId].enabled = false;
            saveSchedules(schedules);
            
            await sock.sendMessage(chatId, { text: "❌ Group schedule DISABLED! Group will NOT auto manage." }, { quoted: msg });
            return;
        }
        
        // Clear all schedules
        if (subCommand === 'clear' || subCommand === 'reset') {
            const schedules = loadSchedules();
            delete schedules[chatId];
            saveSchedules(schedules);
            
            await sock.sendMessage(chatId, { text: "✅ All schedules cleared for this group!" }, { quoted: msg });
            return;
        }
        
        // Help
        await sock.sendMessage(chatId, {
            text: `📅 *GROUP SCHEDULE COMMANDS*\n\n` +
                  `🔹 ${prefix}schedule info - Show current schedule\n` +
                  `🔹 ${prefix}schedule set <open> <close> <days> - Add schedule\n` +
                  `🔹 ${prefix}schedule remove <number> - Remove schedule\n` +
                  `🔹 ${prefix}schedule enable - Activate schedule\n` +
                  `🔹 ${prefix}schedule disable - Deactivate schedule\n` +
                  `🔹 ${prefix}schedule clear - Delete all schedules\n\n` +
                  `📌 *Examples:*\n` +
                  `${prefix}schedule set 08:00 17:00 mon-fri\n` +
                  `${prefix}schedule set 22:00 06:00 sat-sun\n` +
                  `${prefix}schedule set 09:00 18:00 all\n\n` +
                  `*Days:* sun, mon, tue, wed, thu, fri, sat`
        }, { quoted: msg });
    }
};
