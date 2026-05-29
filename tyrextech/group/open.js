// ============================================
// GROUP SCHEDULE - Auto open/close group at specific times
// Powered by Tyrex KSH Tech
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEDULE_FILE = path.join(__dirname, '../../database', 'group_schedules.json');

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

export default {
    name: 'schedule',
    description: 'Set group auto open/close schedule',
    category: 'group',
    alias: ['sch', 'jadwal', 'timeset'],
    
    async execute(sock, msg, args, prefix, config) {
        try {
            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || chatId;
            
            // Check if group
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
                
                if (!groupSchedule || !groupSchedule.openTime || !groupSchedule.closeTime) {
                    await sock.sendMessage(chatId, {
                        text: `📅 *GROUP SCHEDULE*\n\nNo schedule set.\n\n📝 *Usage:*\n${prefix}schedule set 08:00 17:00\n${prefix}schedule enable\n${prefix}schedule disable\n\n📌 *Example:*\n${prefix}schedule set 08:00 17:00\n${prefix}schedule set 22:00 06:00`
                    }, { quoted: msg });
                    return;
                }
                
                let infoText = `━━━━━━━━━━━━━━━━━━\n`;
                infoText += `     📅 *GROUP SCHEDULE* 📅\n`;
                infoText += `━━━━━━━━━━━━━━━━━━\n\n`;
                infoText += `📊 *Status:* ${groupSchedule.enabled ? '✅ ENABLED' : '❌ DISABLED'}\n\n`;
                infoText += `⏰ *Open Time:* ${groupSchedule.openTime}\n`;
                infoText += `🔓 *Close Time:* ${groupSchedule.closeTime}\n`;
                infoText += `📆 *Days:* ${groupSchedule.days || 'Everyday'}\n\n`;
                infoText += `━━━━━━━━━━━━━━━━━━`;
                
                await sock.sendMessage(chatId, { text: infoText }, { quoted: msg });
                return;
            }
            
            // Set schedule
            if (subCommand === 'set') {
                const openTime = args[1];
                const closeTime = args[2];
                const days = args[3] || 'everyday';
                
                if (!openTime || !closeTime) {
                    await sock.sendMessage(chatId, {
                        text: `📝 *Usage:* ${prefix}schedule set <open_time> <close_time> <days>\n\n📌 *Example:*\n${prefix}schedule set 08:00 17:00\n${prefix}schedule set 22:00 06:00 weekend\n\n*Days:* everyday, weekday, weekend`
                    }, { quoted: msg });
                    return;
                }
                
                // Validate time format
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                if (!timeRegex.test(openTime) || !timeRegex.test(closeTime)) {
                    await sock.sendMessage(chatId, { text: "❌ Invalid time! Use HH:MM format (e.g., 08:00, 17:30)" }, { quoted: msg });
                    return;
                }
                
                // Save schedule
                const schedules = loadSchedules();
                schedules[chatId] = {
                    openTime: openTime,
                    closeTime: closeTime,
                    days: days,
                    enabled: true
                };
                saveSchedules(schedules);
                
                await sock.sendMessage(chatId, {
                    text: `✅ *Schedule Set!*\n\n🔓 Open: ${openTime}\n🔒 Close: ${closeTime}\n📆 Days: ${days}\n\n⚡ Schedule enabled successfully!`
                }, { quoted: msg });
                return;
            }
            
            // Enable schedule
            if (subCommand === 'enable' || subCommand === 'on') {
                const schedules = loadSchedules();
                if (!schedules[chatId] || (!schedules[chatId].openTime && !schedules[chatId].closeTime)) {
                    await sock.sendMessage(chatId, { text: "❌ No schedule set! Use .schedule set first." }, { quoted: msg });
                    return;
                }
                
                schedules[chatId].enabled = true;
                saveSchedules(schedules);
                await sock.sendMessage(chatId, { text: "✅ Schedule ENABLED! Group will auto open/close." }, { quoted: msg });
                return;
            }
            
            // Disable schedule
            if (subCommand === 'disable' || subCommand === 'off') {
                const schedules = loadSchedules();
                if (!schedules[chatId]) {
                    await sock.sendMessage(chatId, { text: "❌ No schedule found!" }, { quoted: msg });
                    return;
                }
                
                schedules[chatId].enabled = false;
                saveSchedules(schedules);
                await sock.sendMessage(chatId, { text: "❌ Schedule DISABLED! Group will NOT auto manage." }, { quoted: msg });
                return;
            }
            
            // Clear schedule
            if (subCommand === 'clear' || subCommand === 'reset') {
                const schedules = loadSchedules();
                delete schedules[chatId];
                saveSchedules(schedules);
                await sock.sendMessage(chatId, { text: "✅ Schedule cleared!" }, { quoted: msg });
                return;
            }
            
            // Help
            await sock.sendMessage(chatId, {
                text: `📅 *GROUP SCHEDULE COMMANDS*\n\n` +
                      `🔹 ${prefix}schedule info - Show schedule\n` +
                      `🔹 ${prefix}schedule set <open> <close> - Set schedule\n` +
                      `🔹 ${prefix}schedule enable - Activate\n` +
                      `🔹 ${prefix}schedule disable - Deactivate\n` +
                      `🔹 ${prefix}schedule clear - Delete schedule\n\n` +
                      `📌 *Examples:*\n` +
                      `${prefix}schedule set 08:00 17:00\n` +
                      `${prefix}schedule set 22:00 06:00\n\n` +
                      `⚡ Group will auto open at 08:00 and close at 17:00`
            }, { quoted: msg });
            return;
            
        } catch (error) {
            console.error('Schedule error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Error: ${error.message}`
            }, { quoted: msg });
        }
    }
};
