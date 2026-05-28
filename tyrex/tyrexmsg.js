// ============================================
// SILA MSG - Message Handlers & Logger
// Powered by SILA TECH
// ============================================

import chalk from 'chalk';
import { cleanJid } from './tyrexfunctions.js';

const originalConsoleMethods = {
    log: console.log, info: console.info, warn: console.warn,
    error: console.error, debug: console.debug, trace: console.trace,
    dir: console.dir, dirxml: console.dirxml, table: console.table,
    time: console.time, timeEnd: console.timeEnd, timeLog: console.timeLog,
    group: console.group, groupEnd: console.groupEnd, groupCollapsed: console.groupCollapsed,
    clear: console.clear, count: console.count, countReset: console.countReset,
    assert: console.assert, profile: console.profile, profileEnd: console.profileEnd,
    timeStamp: console.timeStamp, context: console.context
};

let messageLogCounter = 0;

// ============ ULTRA CLEAN LOGGER ============
export class UltraCleanLogger {
    static log(...args) {
        const message = args.join(' ').toLowerCase();
        const suppressPatterns = ['buffer','timeout','transaction','failed to decrypt','received error','sessionerror','bad mac','stream errored','baileys','whatsapp','ws','closing session','sessionentry','_chains','registrationid','currentratchet','indexinfo','pendingprekey','ephemeralkeypair','lastremoteephemeralkey','rootkey','basekey','signal','key','ratchet','encryption','decryption','qr','scan','pairing','connection.update','creds.update','messages.upsert','group','participant','metadata','presence.update','chat.update','message.receipt.update','message.update','keystore','keypair','pubkey','privkey','<buffer','05 ','0x','signalkey','signalprotocol','sessionstate','senderkey','groupcipher','signalgroup'];
        for (const pattern of suppressPatterns) { if (message.includes(pattern)) return; }
        const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}]`);
        const cleanArgs = args.map(arg => typeof arg === 'string' ? arg.replace(/\n\s+/g, ' ') : arg);
        originalConsoleMethods.log(timestamp, ...cleanArgs);
    }
    static error(...args) {
        const message = args.join(' ');
        if (message.toLowerCase().includes('fatal') || message.toLowerCase().includes('critical') || message.includes('❌')) {
            const timestamp = chalk.red(`[${new Date().toLocaleTimeString()}]`);
            originalConsoleMethods.error(timestamp, ...args);
        }
    }
    static success(...args) { originalConsoleMethods.log(chalk.green(`[${new Date().toLocaleTimeString()}]`), chalk.green('✅'), ...args); }
    static info(...args) { originalConsoleMethods.log(chalk.blue(`[${new Date().toLocaleTimeString()}]`), chalk.blue('ℹ️'), ...args); }
    static warning(...args) { originalConsoleMethods.log(chalk.yellow(`[${new Date().toLocaleTimeString()}]`), chalk.yellow('⚠️'), ...args); }
    static event(...args) { originalConsoleMethods.log(chalk.magenta(`[${new Date().toLocaleTimeString()}]`), chalk.magenta('🎭'), ...args); }
    static command(...args) { originalConsoleMethods.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.cyan('💬'), ...args); }
    static critical(...args) { originalConsoleMethods.error(chalk.red(`[${new Date().toLocaleTimeString()}]`), chalk.red('🚨'), ...args); }
    static group(...args) { originalConsoleMethods.log(chalk.magenta(`[${new Date().toLocaleTimeString()}]`), chalk.magenta('👥'), ...args); }
    static member(...args) { originalConsoleMethods.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.cyan('👤'), ...args); }
}

// Override console methods
console.log = UltraCleanLogger.log;
console.error = UltraCleanLogger.error;
console.info = UltraCleanLogger.info;
console.warn = UltraCleanLogger.warning;
console.debug = () => {};
console.critical = UltraCleanLogger.critical;
global.logSuccess = UltraCleanLogger.success;
global.logInfo = UltraCleanLogger.info;
global.logWarning = UltraCleanLogger.warning;
global.logEvent = UltraCleanLogger.event;
global.logCommand = UltraCleanLogger.command;
global.logGroup = UltraCleanLogger.group;
global.logMember = UltraCleanLogger.member;

// ============ ULTRA SILENT LOGGER FOR BAILEYS ============
export const ultraSilentLogger = {
    level: 'silent', trace: () => {}, debug: () => {}, info: () => {}, warn: () => {},
    error: () => {}, fatal: () => {}, child: () => ultraSilentLogger, log: () => {},
    success: () => {}, warning: () => {}, event: () => {}, command: () => {}
};

// ============ MESSAGE STORE ============
export class MessageStore {
    constructor() { 
        this.messages = new Map(); 
        this.maxMessages = 100; 
    }
    addMessage(jid, messageId, message) {
        try {
            const key = `${jid}|${messageId}`;
            this.messages.set(key, { ...message, timestamp: Date.now() });
            if (this.messages.size > this.maxMessages) {
                this.messages.delete(this.messages.keys().next().value);
            }
        } catch {}
    }
    getMessage(jid, messageId) { 
        try { 
            return this.messages.get(`${jid}|${messageId}`) || null; 
        } catch { 
            return null; 
        } 
    }
}

// ============ LOG INCOMING MESSAGE ============
export async function logIncomingMessage(sock, msg, textMsg, groupName = null) {
    try {
        messageLogCounter++;
        const logNum = messageLogCounter;
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const rawSenderJid = msg.key.participant || chatId;
        const timeStr = new Date().toLocaleTimeString('en-GB', { hour12: false });
        
        const resolvedSenderJid = rawSenderJid;
        const cleaned = cleanJid(resolvedSenderJid);
        const phoneNumber = '+' + cleaned.cleanNumber;
        
        let displayName = phoneNumber;
        try {
            const contacts = sock.store?.contacts || {};
            const contact = contacts[resolvedSenderJid] || contacts[rawSenderJid];
            displayName = contact?.name || contact?.notify || phoneNumber;
        } catch {}
        
        if (isGroup) {
            let gName = groupName || chatId;
            const line = '─'.repeat(42);
            originalConsoleMethods.log(chalk.green(
                `\n╭${line}\n` +
                `│ 🧛 ${chalk.bold(`SILA SMD LOG #${logNum}`)}\n` +
                `├${line}\n` +
                `│ 👥 ${chalk.bold('Group  :')} ${gName}\n` +
                `│ 👤 ${chalk.bold('Sender :')} ${displayName}\n` +
                `│ ☎️  ${chalk.bold('Number :')} ${phoneNumber}\n` +
                `│ 💬 ${chalk.bold('Msg    :')} ${textMsg.substring(0, 80)}${textMsg.length > 80 ? '…' : ''}\n` +
                `│ 🕒 ${chalk.bold('Time   :')} ${timeStr}\n` +
                `╰${line}`
            ));
        } else {
            const line = '─'.repeat(37);
            originalConsoleMethods.log(chalk.green(
                `\n╭${line}\n` +
                `│ 🧛 ${chalk.bold(`SILA SMD LOG #${logNum}`)}\n` +
                `├${line}\n` +
                `│ 👤 ${chalk.bold('Name   :')} ${displayName}\n` +
                `│ ☎️  ${chalk.bold('Number :')} ${phoneNumber}\n` +
                `│ 💬 ${chalk.bold('Msg    :')} ${textMsg.substring(0, 80)}${textMsg.length > 80 ? '…' : ''}\n` +
                `│ 🕒 ${chalk.bold('Time   :')} ${timeStr}\n` +
                `╰${line}`
            ));
        }
    } catch {}
}

// ============ PROCESS FILTER ============
export function setupProcessFilter() {
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;
    const sessionPatterns = ['closing session','sessionentry','registrationid','currentratchet',
        'indexinfo','pendingprekey','_chains','ephemeralkeypair','lastremoteephemeralkey','rootkey','basekey'];
    const filterOutput = (chunk) => {
        const lowerChunk = chunk.toString().toLowerCase();
        return !sessionPatterns.some(p => lowerChunk.includes(p));
    };
    process.stdout.write = function (chunk, encoding, callback) {
        if (filterOutput(chunk)) return originalStdoutWrite.call(this, chunk, encoding, callback);
        if (callback) callback(); return true;
    };
    process.stderr.write = function (chunk, encoding, callback) {
        if (filterOutput(chunk)) return originalStderrWrite.call(this, chunk, encoding, callback);
        if (callback) callback(); return true;
    };
}

export function silenceBaileysCompletely() {
    try { 
        const pino = require('pino'); 
        pino({ level: 'silent', enabled: false }); 
    } catch {}
}

// ============ RATE LIMIT PROTECTION ============
export class RateLimitProtection {
    constructor(minCommandDelay = 1000, stickerDelay = 2000, rateLimitEnabled = true) {
        this.commandTimestamps = new Map();
        this.userCooldowns = new Map();
        this.globalCooldown = Date.now();
        this.stickerSendTimes = new Map();
        this.minCommandDelay = minCommandDelay;
        this.stickerDelay = stickerDelay;
        this.rateLimitEnabled = rateLimitEnabled;
        setInterval(() => this.cleanup(), 60000);
    }
    
    canSendCommand(chatId, userId, command) {
        if (!this.rateLimitEnabled) return { allowed: true };
        const now = Date.now();
        const userKey = `${userId}_${command}`;
        const chatKey = `${chatId}_${command}`;
        
        if (this.userCooldowns.has(userKey)) {
            const timeDiff = now - this.userCooldowns.get(userKey);
            if (timeDiff < this.minCommandDelay) return { allowed: false, reason: `Please wait ${Math.ceil((this.minCommandDelay - timeDiff) / 1000)}s` };
        }
        if (this.commandTimestamps.has(chatKey)) {
            const timeDiff = now - this.commandTimestamps.get(chatKey);
            if (timeDiff < this.minCommandDelay) return { allowed: false, reason: `Cooldown: ${Math.ceil((this.minCommandDelay - timeDiff) / 1000)}s remaining` };
        }
        if (now - this.globalCooldown < 250) return { allowed: false, reason: 'System busy. Try again.' };
        
        this.userCooldowns.set(userKey, now);
        this.commandTimestamps.set(chatKey, now);
        this.globalCooldown = now;
        return { allowed: true };
    }
    
    async waitForSticker(chatId) {
        if (!this.rateLimitEnabled) { 
            await this.delay(this.stickerDelay); 
            return; 
        }
        const now = Date.now();
        const lastSticker = this.stickerSendTimes.get(chatId) || 0;
        const timeDiff = now - lastSticker;
        if (timeDiff < this.stickerDelay) await this.delay(this.stickerDelay - timeDiff);
        this.stickerSendTimes.set(chatId, Date.now());
    }
    
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    cleanup() {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        for (const [key, timestamp] of this.userCooldowns.entries()) { 
            if (now - timestamp > fiveMinutes) this.userCooldowns.delete(key); 
        }
        for (const [key, timestamp] of this.commandTimestamps.entries()) { 
            if (now - timestamp > fiveMinutes) this.commandTimestamps.delete(key); 
        }
    }
}
