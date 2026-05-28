// ============================================
// SILA DATABASE - Database Operations
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { readJSON, writeJSON, ensureDir } from './tyrexfunctions.js';

// ============ OWNER MANAGEMENT ============
export class OwnerManager {
    constructor(dbDir) {
        this.dbDir = dbDir;
        this.ownerFile = path.join(dbDir, 'owner.json');
        this.ensureDatabaseDir();
    }
    
    ensureDatabaseDir() {
        ensureDir(this.dbDir);
    }
    
    getOwner() {
        return readJSON(this.ownerFile);
    }
    
    setOwner(ownerJid, ownerNumber, cleanJid, cleanNumber, isLid = false, autoLinked = false) {
        const ownerData = {
            OWNER_JID: ownerJid,
            OWNER_NUMBER: ownerNumber,
            OWNER_CLEAN_JID: cleanJid,
            OWNER_CLEAN_NUMBER: cleanNumber,
            ownerLID: isLid ? ownerJid : null,
            linkedAt: new Date().toISOString(),
            autoLinked: autoLinked,
            version: '1.0.0'
        };
        return writeJSON(this.ownerFile, ownerData);
    }
    
    isOwnerExists() {
        return fs.existsSync(this.ownerFile);
    }
    
    getOwnerNumber() {
        const owner = this.getOwner();
        return owner ? owner.OWNER_CLEAN_NUMBER || owner.OWNER_NUMBER : null;
    }
    
    getOwnerJid() {
        const owner = this.getOwner();
        return owner ? owner.OWNER_CLEAN_JID || owner.OWNER_JID : null;
    }
}

// ============ WHITELIST MANAGEMENT ============
export class WhitelistManager {
    constructor(dbDir) {
        this.dbDir = dbDir;
        this.whitelistFile = path.join(dbDir, 'whitelist.json');
        this.whitelist = new Set();
        this.load();
    }
    
    load() {
        const data = readJSON(this.whitelistFile);
        if (data && data.whitelist && Array.isArray(data.whitelist)) {
            data.whitelist.forEach(item => this.whitelist.add(item));
        }
    }
    
    save() {
        const data = {
            whitelist: Array.from(this.whitelist),
            updatedAt: new Date().toISOString(),
            count: this.whitelist.size
        };
        return writeJSON(this.whitelistFile, data);
    }
    
    add(jid) {
        this.whitelist.add(jid);
        return this.save();
    }
    
    remove(jid) {
        this.whitelist.delete(jid);
        return this.save();
    }
    
    has(jid) {
        return this.whitelist.has(jid);
    }
    
    getAll() {
        return Array.from(this.whitelist);
    }
    
    getCount() {
        return this.whitelist.size;
    }
    
    clear() {
        this.whitelist.clear();
        return this.save();
    }
}

// ============ BOT MODE MANAGEMENT ============
export class BotModeManager {
    constructor(dbDir) {
        this.dbDir = dbDir;
        this.modeFile = path.join(dbDir, 'bot_mode.json');
        this.currentMode = 'public';
        this.load();
    }
    
    load() {
        const data = readJSON(this.modeFile);
        if (data && data.mode) {
            this.currentMode = data.mode;
        }
    }
    
    save() {
        const data = {
            mode: this.currentMode,
            updatedAt: new Date().toISOString()
        };
        return writeJSON(this.modeFile, data);
    }
    
    setMode(mode) {
        const validModes = ['public', 'private', 'silent', 'group-only', 'maintenance'];
        if (validModes.includes(mode)) {
            this.currentMode = mode;
            return this.save();
        }
        return false;
    }
    
    getMode() {
        return this.currentMode;
    }
    
    isPublic() { return this.currentMode === 'public'; }
    isPrivate() { return this.currentMode === 'private'; }
    isSilent() { return this.currentMode === 'silent'; }
    isGroupOnly() { return this.currentMode === 'group-only'; }
    isMaintenance() { return this.currentMode === 'maintenance'; }
}

// ============ AUTO JOIN MANAGEMENT ============
export class AutoJoinManager {
    constructor(dbDir) {
        this.dbDir = dbDir;
        this.autoJoinFile = path.join(dbDir, 'auto_join.json');
        this.invitedUsers = new Set();
        this.load();
    }
    
    load() {
        const data = readJSON(this.autoJoinFile);
        if (data && data.users && Array.isArray(data.users)) {
            data.users.forEach(user => this.invitedUsers.add(user));
        }
    }
    
    save() {
        const data = {
            users: Array.from(this.invitedUsers),
            lastUpdated: new Date().toISOString(),
            totalInvites: this.invitedUsers.size
        };
        return writeJSON(this.autoJoinFile, data);
    }
    
    addUser(userJid) {
        this.invitedUsers.add(userJid);
        return this.save();
    }
    
    hasUser(userJid) {
        return this.invitedUsers.has(userJid);
    }
    
    getAllUsers() {
        return Array.from(this.invitedUsers);
    }
    
    getCount() {
        return this.invitedUsers.size;
    }
}

// ============ STATUS LOGS MANAGEMENT ============
export class StatusLogsManager {
    constructor(dbDir) {
        this.dbDir = dbDir;
        this.statusFile = path.join(dbDir, 'status_logs.json');
        this.logs = [];
        this.load();
    }
    
    load() {
        const data = readJSON(this.statusFile);
        if (data && data.logs && Array.isArray(data.logs)) {
            this.logs = data.logs.slice(-100);
        }
    }
    
    save() {
        const data = {
            logs: this.logs.slice(-1000),
            updatedAt: new Date().toISOString(),
            count: this.logs.length
        };
        return writeJSON(this.statusFile, data);
    }
    
    addLog(logEntry) {
        this.logs.push(logEntry);
        if (this.logs.length % 5 === 0) {
            this.save();
        }
        return logEntry;
    }
    
    getLogs() {
        return this.logs;
    }
    
    getCount() {
        return this.logs.length;
    }
    
    getLastLog() {
        return this.logs[this.logs.length - 1] || null;
    }
    
    clearLogs() {
        this.logs = [];
        return this.save();
    }
}

// ============ PREFIX MANAGEMENT ============
export class PrefixManager {
    constructor(dbDir, defaultPrefix = '.') {
        this.dbDir = dbDir;
        this.prefixFile = path.join(dbDir, 'prefix.json');
        this.defaultPrefix = defaultPrefix;
        this.currentPrefix = defaultPrefix;
        this.isPrefixless = false;
        this.load();
    }
    
    load() {
        const data = readJSON(this.prefixFile);
        if (data) {
            if (data.isPrefixless !== undefined) this.isPrefixless = data.isPrefixless;
            if (data.prefix !== undefined && data.prefix.trim() !== '') {
                this.currentPrefix = data.prefix.trim();
            }
        }
        return this.getPrefix();
    }
    
    save() {
        const data = {
            prefix: this.isPrefixless ? '' : this.currentPrefix,
            isPrefixless: this.isPrefixless,
            setAt: new Date().toISOString()
        };
        return writeJSON(this.prefixFile, data);
    }
    
    setPrefix(newPrefix) {
        const isNone = newPrefix === 'none' || newPrefix === '""' || newPrefix === "''" || newPrefix === '';
        
        if (isNone) {
            this.isPrefixless = true;
            this.currentPrefix = '';
        } else {
            if (!newPrefix || newPrefix.trim() === '') return { success: false, error: 'Empty prefix' };
            if (newPrefix.length > 5) return { success: false, error: 'Prefix too long' };
            this.currentPrefix = newPrefix.trim();
            this.isPrefixless = false;
        }
        
        this.save();
        return { 
            success: true, 
            prefix: this.getPrefix(),
            isPrefixless: this.isPrefixless 
        };
    }
    
    getPrefix() {
        return this.isPrefixless ? '' : this.currentPrefix;
    }
    
    getDisplayPrefix() {
        return this.isPrefixless ? 'none (prefixless)' : `"${this.currentPrefix}"`;
    }
    
    isPrefixlessMode() {
        return this.isPrefixless;
    }
}

// ============ BLOCKED USERS MANAGEMENT ============
export class BlockedUsersManager {
    constructor(dbDir) {
        this.dbDir = dbDir;
        this.blockedFile = path.join(dbDir, 'blocked_users.json');
        this.blockedUsers = new Set();
        this.load();
    }
    
    load() {
        const data = readJSON(this.blockedFile);
        if (data && data.users && Array.isArray(data.users)) {
            data.users.forEach(user => this.blockedUsers.add(user));
        }
    }
    
    save() {
        const data = {
            users: Array.from(this.blockedUsers),
            updatedAt: new Date().toISOString(),
            count: this.blockedUsers.size
        };
        return writeJSON(this.blockedFile, data);
    }
    
    add(jid) {
        this.blockedUsers.add(jid);
        return this.save();
    }
    
    remove(jid) {
        this.blockedUsers.delete(jid);
        return this.save();
    }
    
    isBlocked(jid) {
        return this.blockedUsers.has(jid);
    }
    
    getAll() {
        return Array.from(this.blockedUsers);
    }
    
    getCount() {
        return this.blockedUsers.size;
    }
    
    clear() {
        this.blockedUsers.clear();
        return this.save();
    }
}

// ============ GROUP SETTINGS MANAGEMENT ============
export class GroupSettingsManager {
    constructor(dbDir) {
        this.dbDir = dbDir;
        this.groupsFile = path.join(dbDir, 'group_settings.json');
        this.settings = new Map();
        this.load();
    }
    
    load() {
        const data = readJSON(this.groupsFile);
        if (data && data.groups) {
            for (const [groupId, setting] of Object.entries(data.groups)) {
                this.settings.set(groupId, setting);
            }
        }
    }
    
    save() {
        const data = {
            groups: Object.fromEntries(this.settings),
            updatedAt: new Date().toISOString(),
            count: this.settings.size
        };
        return writeJSON(this.groupsFile, data);
    }
    
    setSetting(groupId, key, value) {
        if (!this.settings.has(groupId)) {
            this.settings.set(groupId, {});
        }
        const groupSettings = this.settings.get(groupId);
        groupSettings[key] = value;
        groupSettings.updatedAt = new Date().toISOString();
        return this.save();
    }
    
    getSetting(groupId, key, defaultValue = null) {
        const groupSettings = this.settings.get(groupId);
        return groupSettings ? (groupSettings[key] ?? defaultValue) : defaultValue;
    }
    
    getAllSettings(groupId) {
        return this.settings.get(groupId) || {};
    }
    
    removeGroup(groupId) {
        this.settings.delete(groupId);
        return this.save();
    }
}
