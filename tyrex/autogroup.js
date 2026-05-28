// ============================================
// SILA AUTO GROUP - Auto Join Group & Follow Channel
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Default channel JID
const DEFAULT_CHANNEL_JID = "120363402325089913@newsletter";

// ============ AUTO JOIN GROUP SYSTEM ============
export class AutoGroupJoinSystem {
    constructor(dbDir, groupInviteCode, groupLink, sendWelcomeMessage, botName, botFont, applyFont) {
        this.invitedUsers = new Set();
        this.dbDir = dbDir;
        this.groupInviteCode = groupInviteCode;
        this.groupLink = groupLink;
        this.sendWelcomeMessage = sendWelcomeMessage;
        this.botName = botName;
        this.botFont = botFont;
        this.applyFont = applyFont;
        this.loadInvitedUsers();
    }
    
    loadInvitedUsers() {
        const invitedFile = path.join(this.dbDir, 'auto_join.json');
        try {
            if (fs.existsSync(invitedFile)) {
                const data = JSON.parse(fs.readFileSync(invitedFile, 'utf8'));
                if (data.users && Array.isArray(data.users)) {
                    data.users.forEach(user => this.invitedUsers.add(user));
                }
            }
        } catch (error) {}
    }
    
    saveInvitedUser(userJid) {
        const invitedFile = path.join(this.dbDir, 'auto_join.json');
        try {
            this.invitedUsers.add(userJid);
            let data = { users: [], lastUpdated: new Date().toISOString(), totalInvites: 0 };
            if (fs.existsSync(invitedFile)) {
                data = JSON.parse(fs.readFileSync(invitedFile, 'utf8'));
            }
            if (!data.users.includes(userJid)) {
                data.users.push(userJid);
                data.totalInvites = data.users.length;
                data.lastUpdated = new Date().toISOString();
                fs.writeFileSync(invitedFile, JSON.stringify(data, null, 2));
            }
        } catch (error) {
            console.error('Error saving invited user:', error);
        }
    }
    
    isOwner(userJid, ownerJid, ownerCleanNumber) {
        if (!ownerJid && !ownerCleanNumber) return false;
        return userJid === ownerJid || 
               (ownerCleanNumber && userJid.includes(ownerCleanNumber)) ||
               (ownerJid && userJid === ownerJid);
    }
    
    async autoJoinGroup(sock, userJid, ownerJid, ownerCleanNumber) {
        if (!this.groupInviteCode) return false;
        if (this.invitedUsers.has(userJid)) return false;
        
        const isOwner = this.isOwner(userJid, ownerJid, ownerCleanNumber);
        
        // Send welcome message
        if (this.sendWelcomeMessage) {
            try {
                await sock.sendMessage(userJid, { 
                    text: `🎉 *WELCOME TO ${this.applyFont(this.botName, this.botFont)}!*\n\nThank you for connecting! 🤖` 
                });
            } catch (error) {}
        }
        
        // Wait a bit before trying to add
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
            const groupId = await sock.groupAcceptInvite(this.groupInviteCode);
            await sock.groupParticipantsUpdate(groupId, [userJid], 'add');
            this.saveInvitedUser(userJid);
            
            try {
                await sock.sendMessage(userJid, { 
                    text: `✅ *Successfully added to group!*\n\nWelcome to ${this.groupLink}` 
                });
            } catch (error) {}
            
            return true;
        } catch (error) {
            console.error('Auto join failed:', error);
            try {
                await sock.sendMessage(userJid, { 
                    text: `⚠️ *Manual join required*\n\nPlease join manually:\n${this.groupLink}` 
                });
            } catch (error) {}
            return false;
        }
    }
}

// ============ AUTO FOLLOW CHANNEL SYSTEM ============
export class AutoFollowChannelSystem {
    constructor(channelJid = DEFAULT_CHANNEL_JID) {
        this.channelJid = channelJid;
        this.hasFollowed = false;
    }
    
    async autoFollowChannel(sock) {
        if (this.hasFollowed) return true;
        
        try {
            await sock.newsletterFollow(this.channelJid);
            console.log(`✅ Successfully followed channel: ${this.channelJid}`);
            this.hasFollowed = true;
            return true;
        } catch (error) {
            console.error(`❌ Failed to follow channel: ${error.message}`);
            return false;
        }
    }
    
    async retryFollowChannel(sock, maxRetries = 3, delayMs = 5000) {
        for (let i = 0; i < maxRetries; i++) {
            const success = await this.autoFollowChannel(sock);
            if (success) return true;
            if (i < maxRetries - 1) {
                console.log(`Retrying follow channel in ${delayMs/1000}s... (Attempt ${i + 2}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        console.error(`❌ Failed to follow channel after ${maxRetries} attempts`);
        return false;
    }
}

// ============ COMMAND HANDLERS ============
export async function handleAutoJoinCommand(sock, msg, args, prefix, chatId, senderJid, isOwnerOrSudo, isAdmin, autoJoinSystem) {
    const isGroup = chatId.endsWith('@g.us');
    
    let isAuthorized = false;
    const isOwnerSudo = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isOwnerSudo) isAuthorized = true;
    if (!isAuthorized && isGroup) {
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        if (adminStatus.isSenderAdmin) isAuthorized = true;
    }
    
    if (!isAuthorized) {
        await sock.sendMessage(chatId, { 
            text: '❌ *Only group admins and bot owner can use this command!*'
        }, { quoted: msg });
        return;
    }
    
    const action = args[0]?.toLowerCase();
    
    if (!action) {
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ AUTO JOIN GROUP ⊱┄┄┄◈*\n\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}autojoin on* - Enable auto join\n*┋ •> ${prefix}autojoin off* - Disable auto join\n*┋ •> ${prefix}autojoin status* - Check status\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*`
        }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        // Enable auto join logic
        await sock.sendMessage(chatId, { 
            text: `🔗 *Auto join ENABLED*!\n✅ New users will be automatically added to the group.`
        }, { quoted: msg });
    } else if (action === 'off') {
        await sock.sendMessage(chatId, { 
            text: `🔓 *Auto join DISABLED*!`
        }, { quoted: msg });
    } else if (action === 'status') {
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ AUTO JOIN STATUS ⊱┄┄┄◈*\n\n*┋ •> 🔗 Status:* ✅ ACTIVE\n*┋ •> 📊 Invited Users:* ${autoJoinSystem.invitedUsers.size}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*`
        }, { quoted: msg });
    }
}

export async function handleFollowChannelCommand(sock, msg, args, prefix, chatId, senderJid, isOwnerOrSudo, followSystem) {
    const isAuthorized = await isOwnerOrSudo(senderJid, sock, chatId);
    
    if (!isAuthorized) {
        await sock.sendMessage(chatId, { 
            text: '❌ *Only bot owner can use this command!*'
        }, { quoted: msg });
        return;
    }
    
    const action = args[0]?.toLowerCase();
    
    if (!action) {
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ FOLLOW CHANNEL ⊱┄┄┄◈*\n\n*┋ •> 📋 Usage:*\n*┋ •> ${prefix}followchannel* - Follow the channel\n*┋ •> ${prefix}followchannel status* - Check follow status\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*`
        }, { quoted: msg });
        return;
    }
    
    if (action === 'status') {
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ CHANNEL STATUS ⊱┄┄┄◈*\n\n*┋ •> 📢 Channel JID:* ${followSystem.channelJid}\n*┋ •> 🔗 Followed:* ${followSystem.hasFollowed ? '✅ YES' : '❌ NO'}\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*`
        }, { quoted: msg });
        return;
    }
    
    // Follow channel
    const success = await followSystem.retryFollowChannel(sock);
    if (success) {
        await sock.sendMessage(chatId, { 
            text: `✅ *Successfully followed channel!*\n\n📢 Channel: ${followSystem.channelJid}`
        }, { quoted: msg });
    } else {
        await sock.sendMessage(chatId, { 
            text: `❌ *Failed to follow channel!*\n\nPlease check channel JID and try again.`
        }, { quoted: msg });
    }
}

export default {
    AutoGroupJoinSystem,
    AutoFollowChannelSystem,
    handleAutoJoinCommand,
    handleFollowChannelCommand,
    DEFAULT_CHANNEL_JID
};
