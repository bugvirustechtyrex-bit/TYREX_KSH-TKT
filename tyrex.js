// ============================================
// TYREX KSH MD - Main Bot Module
// Powered by Tyrex KSH Tech
// ============================================

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Import from tyrex folder
import { 
    delay, detectPlatform, cleanJid, ensureDir, extractAndSaveSession
} from './tyrex/tyrexfunctions.js';

import { 
    UltraCleanLogger, ultraSilentLogger, MessageStore, 
    setupProcessFilter, silenceBaileysCompletely, RateLimitProtection
} from './tyrex/tyrexmsg.js';

import {
    OwnerManager, WhitelistManager, BotModeManager, AutoJoinManager,
    StatusLogsManager, PrefixManager, BlockedUsersManager, GroupSettingsManager
} from './tyrex/tyrexdatabase.js';

import { isOwnerOrSudo } from './tyrex/isOwner.js';
import { isAdmin } from './tyrex/isAdmin.js';
import { applyFont, getFontStyles } from './tyrex/fonts/index.js';

// Import Anti modules
import { handleAntiLink, handleAntiLinkCommand, containsGroupLink } from './tyrex/antilink.js';
import { handleStatusMention, handleAntiStatusCommand } from './tyrex/antistatus.js';
import { handleMessageDelete, cacheMessage, deletedMessagesCache, handleAntiDeleteCommand } from './tyrex/antidelete.js';
import { handleAntiMedia, handleAntiMediaCommand, detectMessageType, containsOnlyEmojis } from './tyrex/antimedia.js';
import { handleAntiBadword, handleAntiBadwordCommand } from './tyrex/antibadword.js';

// Import Chatbot module
import { handleChatbotMessage, handleChatbotCommand } from './tyrex/chatbot.js';

// Import Auto Group module
import { AutoGroupJoinSystem, AutoFollowChannelSystem, handleFollowChannelCommand } from './tyrex/autogroup.js';

// Import Login Manager, Auto Link System, Ultimate Fix System, Auto Connect
import { 
    LoginManager, AutoLinkSystem, UltimateFixSystem, AutoConnectOnStart 
} from './tyrex/loginmanager.js';

// Import config
import config, { fkontak, getContextInfo, getFooter, updateConfig, getConfigValue } from './tyrexconfig.js';

// Import handlers from tyrextech folder
import { handleAutoReact } from './tyrextech/automation/autoreactstatus.js';
import { handleAutoView } from './tyrextech/automation/autoviewstatus.js';

// Get directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories
[config.SESSION_DIR, config.DATABASE_DIR, config.CACHE_DIR].forEach(dir => ensureDir(dir));

// Silence Baileys logs
silenceBaileysCompletely();
setupProcessFilter();

// Initialize database managers
const ownerManager = new OwnerManager(config.DATABASE_DIR);
const whitelistManager = new WhitelistManager(config.DATABASE_DIR);
const botModeManager = new BotModeManager(config.DATABASE_DIR);
const autoJoinManager = new AutoJoinManager(config.DATABASE_DIR);
const statusLogsManager = new StatusLogsManager(config.DATABASE_DIR);
const prefixManager = new PrefixManager(config.DATABASE_DIR, config.BOT_PREFIX);
const blockedUsersManager = new BlockedUsersManager(config.DATABASE_DIR);
const groupSettingsManager = new GroupSettingsManager(config.DATABASE_DIR);

// Get deployment mode from .env
const DEPLOY_MODE = config.DEPLOY_MODE;
const HEROKU_SESSION_ID = config.SESSION_ID;
const IS_HEROKU = DEPLOY_MODE === '1' || process.env.DYNO !== undefined;

// Set global prefix variables
let isPrefixless = prefixManager.isPrefixlessMode();
let currentPrefix = prefixManager.getPrefix();

// ============ BOT VARIABLES ============
let SOCKET_INSTANCE = null, isConnected = false, store = null;
let heartbeatInterval = null, lastActivityTime = Date.now(), connectionAttempts = 0;
let AUTO_LINK_ENABLED = true;
let isWaitingForPairingCode = false;
let hasAutoConnectedOnStart = false;
let OWNER_NUMBER = null, OWNER_JID = null, OWNER_CLEAN_JID = null, OWNER_CLEAN_NUMBER = null, OWNER_LID = null;

// Initialize rate limiter
const rateLimiter = new RateLimitProtection(
    config.MIN_COMMAND_DELAY, 
    config.STICKER_DELAY, 
    config.RATE_LIMIT_ENABLED
);

// ============ AUTO GROUP & AUTO FOLLOW SYSTEM ============
const autoGroupSystem = new AutoGroupJoinSystem(
    config.DATABASE_DIR,
    config.GROUP_INVITE_CODE,
    config.GROUP_LINK,
    config.SEND_WELCOME_MESSAGE,
    config.BOT_NAME,
    config.BOT_FONT,
    applyFont
);

// Channel JID yako
const CHANNEL_JID = '120363424973782944@newsletter';

const autoFollowSystem = new AutoFollowChannelSystem(CHANNEL_JID);

// ============ ULTIMATE FIX, AUTO LINK, AUTO CONNECT ============
const ultimateFixSystem = new UltimateFixSystem();
const autoLinkSystem = new AutoLinkSystem(config.AUTO_JOIN_ENABLED, autoGroupSystem);
const autoConnectOnStart = new AutoConnectOnStart(config.AUTO_CONNECT_ON_START);

// ============ JID MANAGER ============
class JidManager {
    constructor() {
        this.ownerJids = new Set();
        this.ownerLids = new Set();
        this.owner = null;
        this.loadOwnerData();
        UltraCleanLogger.success('JID Manager initialized');
    }
    
    loadOwnerData() {
        const owner = ownerManager.getOwner();
        if (owner && owner.OWNER_JID) {
            const cleaned = cleanJid(owner.OWNER_JID);
            this.owner = { 
                rawJid: owner.OWNER_JID, 
                cleanJid: cleaned.cleanJid, 
                cleanNumber: cleaned.cleanNumber, 
                isLid: cleaned.isLid, 
                linkedAt: owner.linkedAt 
            };
            this.ownerJids.add(cleaned.cleanJid);
            this.ownerJids.add(owner.OWNER_JID);
            if (cleaned.isLid) {
                this.ownerLids.add(owner.OWNER_JID);
                this.ownerLids.add(owner.OWNER_JID.split('@')[0]);
                OWNER_LID = owner.OWNER_JID;
            }
            OWNER_JID = owner.OWNER_JID;
            OWNER_NUMBER = cleaned.cleanNumber;
            OWNER_CLEAN_JID = cleaned.cleanJid;
            OWNER_CLEAN_NUMBER = cleaned.cleanNumber;
        }
    }
    
    async isOwner(msg, sock = null) {
        if (!msg || !msg.key) return false;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const chatId = msg.key.remoteJid;
        return await isOwnerOrSudo(senderJid, sock, chatId);
    }
    
    isOwnerSync(msg) {
        if (!msg || !msg.key) return false;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const cleaned = cleanJid(senderJid);
        if (!this.owner || !this.owner.cleanNumber) return false;
        if (this.ownerJids.has(cleaned.cleanJid) || this.ownerJids.has(senderJid)) return true;
        if (cleaned.isLid) {
            const lidNumber = cleaned.cleanNumber;
            if (this.ownerLids.has(senderJid) || this.ownerLids.has(lidNumber)) return true;
            if (OWNER_LID && (senderJid === OWNER_LID || lidNumber === OWNER_LID.split('@')[0])) return true;
        }
        return false;
    }
    
    setNewOwner(newJid, isAutoLinked = false) {
        const cleaned = cleanJid(newJid);
        this.ownerJids.clear();
        this.ownerLids.clear();
        this.owner = { 
            rawJid: newJid, 
            cleanJid: cleaned.cleanJid, 
            cleanNumber: cleaned.cleanNumber, 
            isLid: cleaned.isLid, 
            linkedAt: new Date().toISOString(), 
            autoLinked: isAutoLinked 
        };
        this.ownerJids.add(cleaned.cleanJid);
        this.ownerJids.add(newJid);
        if (cleaned.isLid) {
            this.ownerLids.add(newJid);
            this.ownerLids.add(newJid.split('@')[0]);
            OWNER_LID = newJid;
        } else {
            OWNER_LID = null;
        }
        OWNER_JID = newJid;
        OWNER_NUMBER = cleaned.cleanNumber;
        OWNER_CLEAN_JID = cleaned.cleanJid;
        OWNER_CLEAN_NUMBER = cleaned.cleanNumber;
        
        ownerManager.setOwner(newJid, cleaned.cleanNumber, cleaned.cleanJid, cleaned.cleanNumber, cleaned.isLid, isAutoLinked);
        UltraCleanLogger.success(`New owner set: ${cleaned.cleanJid}`);
        return { success: true, owner: this.owner, isLid: cleaned.isLid };
    }
    
    getOwnerInfo() {
        return { 
            ownerJid: this.owner?.cleanJid || null, 
            ownerNumber: this.owner?.cleanNumber || null, 
            ownerLid: OWNER_LID || null,
            isLid: this.owner?.isLid || false 
        };
    }
}

const jidManager = new JidManager();

// ============ COMMANDS SYSTEM ============
const commands = new Map();
const commandCategories = new Map();

async function loadCommandsFromFolder(folderPath, category = 'general') {
    if (!fs.existsSync(folderPath)) return;
    
    try {
        const items = fs.readdirSync(folderPath);
        
        for (const item of items) {
            const fullPath = path.join(folderPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                await loadCommandsFromFolder(fullPath, item);
            } 
            else if (item.endsWith('.js')) {
                try {
                    if (item.includes('.test.') || item.includes('.disabled.')) continue;
                    
                    const commandModule = await import(`file://${fullPath}`);
                    const command = commandModule.default || commandModule;
                    
                    if (command && command.name) {
                        command.category = category;
                        commands.set(command.name.toLowerCase(), command);
                        
                        if (!commandCategories.has(category)) {
                            commandCategories.set(category, []);
                        }
                        commandCategories.get(category).push(command.name);
                        
                        if (Array.isArray(command.alias)) {
                            command.alias.forEach(alias => {
                                commands.set(alias.toLowerCase(), command);
                            });
                        }
                        
                        UltraCleanLogger.info(`✅ Loaded command: ${command.name} [${category}]`);
                    }
                } catch (e) {
                    UltraCleanLogger.warning(`Failed to load ${item}: ${e.message}`);
                }
            }
        }
    } catch (error) {
        UltraCleanLogger.error(`Error loading commands from ${folderPath}: ${error.message}`);
    }
}

// ============ UPDATE TERMINAL HEADER ============
function updateTerminalHeader() {
    const prefixDisplay = isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`;
    const deployModeText = IS_HEROKU ? 'HEROKU (Auto)' : 'Local (Menu)';
    const fontStyle = config.BOT_FONT;
    const styledName = applyFont(config.BOT_NAME, fontStyle);
    
    console.clear();
    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════════════╗
║   🧛 ${chalk.bold(`${styledName} v${config.BOT_VERSION}`)}
║   ⚡ POWERED BY TYREX KSH TECH
║   🚀 Deploy Mode: ${deployModeText}
║   💬 Prefix  : ${prefixDisplay}
║   🎨 Font    : ${fontStyle}
║   🔧 Auto Fix: ✅ ENABLED
║   🔗 Anti-Link: ✅ MODULE LOADED
║   📵 Anti-Status: ✅ MODULE LOADED
║   🗑️ Anti-Delete: ✅ MODULE LOADED
║   📷 Anti-Media: ✅ MODULE LOADED
║   🤬 Anti-Badword: ✅ MODULE LOADED
║   🤖 Chatbot: ✅ MODULE LOADED
║   🔗 Auto Group: ✅ MODULE LOADED
║   📢 Auto Follow: ✅ MODULE LOADED
║   ❤️ Auto React Channel: ✅ MODULE LOADED
║   🔐 Login Manager: ✅ MODULE LOADED
║   🔗 Auto Link: ✅ MODULE LOADED
║   🔧 Ultimate Fix: ✅ MODULE LOADED
║   📂 Commands: Loading from tyrextech folder
║   🛡️ Rate Limit Protection: ✅ ACTIVE
╚══════════════════════════════════════════════════════════════════════╝
`));
}

updateTerminalHeader();

// ============ STATUS DETECTOR ============
class StatusDetector {
    constructor() {
        this.detectionEnabled = true;
        this.lastDetection = null;
        UltraCleanLogger.success('Status Detector initialized');
    }
    
    async detectStatusUpdate(msg) {
        try {
            if (!this.detectionEnabled) return null;
            const sender = msg.key.participant || 'unknown';
            const shortSender = sender.split('@')[0];
            const timestamp = msg.messageTimestamp || Date.now();
            const statusTime = new Date(timestamp * 1000).toLocaleTimeString();
            const logEntry = { 
                sender: shortSender, 
                type: 'status', 
                postedAt: statusTime, 
                timestamp: Date.now() 
            };
            statusLogsManager.addLog(logEntry);
            this.lastDetection = logEntry;
            UltraCleanLogger.info(`👁️ Status from ${shortSender} at ${statusTime}`);
            return logEntry;
        } catch { return null; }
    }
    
    getStats() {
        return { 
            totalDetected: statusLogsManager.getCount(), 
            lastDetection: this.lastDetection ? this.lastDetection.sender : 'None',
            detectionEnabled: this.detectionEnabled 
        };
    }
}

const statusDetector = new StatusDetector();

// ============ AUTO LINK SYSTEM INTEGRATION ============
autoLinkSystem.shouldAutoLinkWithJid = async (sock, msg) => {
    return await autoLinkSystem.shouldAutoLink(sock, msg, jidManager, {
        AUTO_LINK_ENABLED: config.AUTO_LINK_ENABLED,
        AUTO_ULTIMATE_FIX_ENABLED: config.AUTO_ULTIMATE_FIX_ENABLED,
        BOT_NAME: config.BOT_NAME,
        BOT_FONT: config.BOT_FONT,
        VERSION: config.VERSION,
        applyFont: applyFont
    });
};

// ============ CONNECT COMMAND ============
async function handleConnectCommand(sock, msg, args, cleaned) {
    try {
        const chatJid = msg.key.remoteJid || cleaned.cleanJid;
        const start = Date.now();
        const prefixDisplay = isPrefixless ? 'none (prefixless)' : `"${currentPrefix}"`;
        const platform = detectPlatform();
        const latency = Date.now() - start;
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = Math.floor(uptime % 60);
        const isOwnerUser = await jidManager.isOwner(msg, sock);
        let statusEmoji, statusText;
        if (latency <= 100) { statusEmoji = '🟢'; statusText = 'Excellent'; }
        else if (latency <= 300) { statusEmoji = '🟡'; statusText = 'Good'; }
        else { statusEmoji = '🔴'; statusText = 'Slow'; }
        
        const styledName = applyFont(config.BOT_NAME, config.BOT_FONT);
        
        await sock.sendMessage(chatJid, { 
            text: `\n╭━━🌕 *CONNECTION STATUS* 🌕━━╮\n┃ ⚡ *Bot:* ${styledName}\n┃ ⚡ *User:* ${cleaned.cleanNumber}\n┃ 🔴 *Prefix:* ${prefixDisplay}\n┃ 🏗️ *Platform:* ${platform}\n┃ ⏱️ *Latency:* ${latency}ms ${statusEmoji}\n┃ ⏰ *Uptime:* ${h}h ${m}m ${s}s\n┃ 🔗 *Status:* ${statusText}\n┃ 👑 *Owner:* ${isOwnerUser ? '✅ Yes' : '❌ No'}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n${getFooter()}`,
            contextInfo: getContextInfo(msg)
        }, { quoted: msg });
        return true;
    } catch { return false; }
}

// ============ CHECK BOT MODE ============
function checkBotMode(msg, commandName) {
    try {
        if (jidManager.isOwnerSync(msg)) return true;
        const mode = botModeManager.getMode();
        const chatJid = msg.key.remoteJid;
        switch (mode) {
            case 'public': return true;
            case 'private': return false;
            case 'silent': return false;
            case 'group-only': return chatJid.includes('@g.us');
            case 'maintenance': return ['ping', 'status', 'uptime', 'help', 'alive'].includes(commandName);
            default: return true;
        }
    } catch { return true; }
}

// ============ INCOMING MESSAGE HANDLER ============
async function handleIncomingMessage(sock, msg) {
    try {
        const chatId = msg.key.remoteJid;
        const senderJid = msg.key.participant || chatId;
        const isGroup = chatId.endsWith('@g.us');
        
        // Cache message for anti-delete
        if (msg.message && !msg.key.fromMe) {
            const textContent = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            cacheMessage(chatId, msg.key.id, {
                sender: senderJid,
                text: textContent.substring(0, 200),
                timestamp: Date.now()
            });
        }
        
        // ============ ANTI-STATUS CHECK ============
        if (isGroup) {
            const handled = await handleStatusMention(sock, msg, chatId, isGroup, config.BOT_NAME, config.BOT_FONT);
            if (handled) return;
        }
        
        // ============ ANTI-LINK CHECK ============
        if (isGroup) {
            const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            if (textMsg && containsGroupLink(textMsg)) {
                const adminStatus = await isAdmin(sock, chatId, senderJid);
                const isOwner = await isOwnerOrSudo(senderJid, sock, chatId);
                if (!adminStatus.isSenderAdmin && !isOwner) {
                    const handled = await handleAntiLink(sock, msg, chatId, senderJid, textMsg, config.BOT_NAME, config.BOT_FONT);
                    if (handled) return;
                }
            }
        }
        
        // ============ ANTI-MEDIA CHECK ============
        if (isGroup) {
            const messageType = detectMessageType(msg);
            if (messageType) {
                let textContent = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                if (messageType === 'text' && textContent && containsOnlyEmojis(textContent)) {
                    const handled = await handleAntiMedia(sock, msg, chatId, senderJid, 'emoji', textContent, config.BOT_NAME, config.BOT_FONT);
                    if (handled) return;
                }
                const handled = await handleAntiMedia(sock, msg, chatId, senderJid, messageType, textContent, config.BOT_NAME, config.BOT_FONT);
                if (handled) return;
            }
        }
        
        // ============ ANTI-BADWORD CHECK ============
        if (isGroup) {
            const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            if (textMsg) {
                const handled = await handleAntiBadword(sock, msg, chatId, senderJid, textMsg, config.BOT_NAME, config.BOT_FONT);
                if (handled) return;
            }
        }
        
        // ============ AUTO LINK CHECK ============
        const linked = await autoLinkSystem.shouldAutoLinkWithJid(sock, msg);
        if (linked) return;
        
        if (blockedUsersManager.isBlocked(senderJid)) return;
        
        const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!textMsg) return;
        
        let commandName = '', args = [];
        
        if (!isPrefixless && textMsg.startsWith(currentPrefix)) {
            const spaceIndex = textMsg.indexOf(' ', currentPrefix.length);
            commandName = spaceIndex === -1 ? textMsg.slice(currentPrefix.length).toLowerCase().trim() : textMsg.slice(currentPrefix.length, spaceIndex).toLowerCase().trim();
            args = spaceIndex === -1 ? [] : textMsg.slice(spaceIndex).trim().split(/\s+/);
        } else if (isPrefixless) {
            const words = textMsg.trim().split(/\s+/);
            const firstWord = words[0].toLowerCase();
            if (commands.has(firstWord)) { 
                commandName = firstWord; 
                args = words.slice(1); 
            } else {
                const defaultCommands = ['ping', 'alive', 'help', 'menu', 'commands', 'list', 'uptime', 'prefixinfo', 'antilink', 'antistatus', 'antidelete', 'antimedia', 'antibadword', 'chatbot', 'autojoin', 'followchannel']; 
                if (defaultCommands.includes(firstWord)) { 
                    commandName = firstWord; 
                    args = words.slice(1); 
                }
            }
        }
        
        if (commandName) {
            const rateLimitCheck = rateLimiter.canSendCommand(chatId, senderJid, commandName);
            if (!rateLimitCheck.allowed) { 
                await sock.sendMessage(chatId, { text: `⚠️ ${rateLimitCheck.reason}` }); 
                return; 
            }
            
            UltraCleanLogger.command(`${chatId.split('@')[0]} → ${commandName}`);
            
            if (!checkBotMode(msg, commandName)) {
                if (botModeManager.isSilent() && !jidManager.isOwnerSync(msg)) return;
                try { await sock.sendMessage(chatId, { text: `❌ *Command Blocked*\nBot is in ${botModeManager.getMode()} mode.` }); } catch {}
                return;
            }
            
            // Anti commands handlers
            if (commandName === 'antilink') {
                await handleAntiLinkCommand(sock, msg, args, currentPrefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
                return;
            }
            if (commandName === 'antistatus') {
                await handleAntiStatusCommand(sock, msg, args, currentPrefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
                return;
            }
            if (commandName === 'antidelete') {
                await handleAntiDeleteCommand(sock, msg, args, currentPrefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
                return;
            }
            if (commandName === 'antimedia') {
                await handleAntiMediaCommand(sock, msg, args, currentPrefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
                return;
            }
            if (commandName === 'antibadword') {
                await handleAntiBadwordCommand(sock, msg, args, currentPrefix, chatId, senderJid, config.BOT_NAME, config.BOT_FONT);
                return;
            }
            if (commandName === 'chatbot') {
                await handleChatbotCommand(sock, msg, args, currentPrefix, chatId, senderJid, isOwnerOrSudo, isAdmin);
                return;
            }
            if (commandName === 'followchannel') {
                await handleFollowChannelCommand(sock, msg, args, currentPrefix, chatId, senderJid, isOwnerOrSudo, autoFollowSystem);
                return;
            }
            if (commandName === 'connect' || commandName === 'link') { 
                const cleaned = cleanJid(senderJid); 
                await handleConnectCommand(sock, msg, args, cleaned); 
                return; 
            }
            
            // Loaded commands from tyrextech folder
            const command = commands.get(commandName);
            if (command) {
                try {
                    if (command.ownerOnly && !(await jidManager.isOwner(msg, sock))) { 
                        try { await sock.sendMessage(chatId, { text: '❌ *Owner Only Command*' }); } catch {} 
                        return; 
                    }
                    
                    const styledName = applyFont(config.BOT_NAME, config.BOT_FONT);
                    
                    await command.execute(sock, msg, args, currentPrefix, { 
                        OWNER_NUMBER: OWNER_CLEAN_NUMBER, 
                        OWNER_JID: OWNER_CLEAN_JID, 
                        OWNER_LID,
                        BOT_NAME: config.BOT_NAME, 
                        BOT_VERSION: config.BOT_VERSION, 
                        BOT_FONT: config.BOT_FONT,
                        isOwner: () => jidManager.isOwnerSync(msg), 
                        jidManager, 
                        store, 
                        statusDetector, 
                        rateLimiter,
                        prefixManager, 
                        botModeManager, 
                        whitelistManager, 
                        blockedUsersManager,
                        updateConfig, 
                        getConfigValue, 
                        applyFont, 
                        getFontStyles, 
                        fkontak, 
                        getContextInfo, 
                        getFooter,
                        isPrefixless, 
                        currentPrefix, 
                        styledName,
                        commandsCount: commands.size,
                        commandCategories: Array.from(commandCategories.keys()),
                        commands: commands,
                        commandCategoriesMap: commandCategories,
                        autoFollowSystem,
                        autoGroupSystem,
                        ultimateFixSystem,
                        autoLinkSystem,
                        updatePrefixImmediately: (newPrefix, prefixMgr) => {
                            const result = prefixMgr.setPrefix(newPrefix);
                            if (result.success) {
                                isPrefixless = prefixMgr.isPrefixlessMode();
                                currentPrefix = prefixMgr.getPrefix();
                                updateTerminalHeader();
                            }
                            return result;
                        },
                        getCurrentPrefix: () => currentPrefix,
                        GROUP_NAME: config.GROUP_NAME,
                        GROUP_LINK: config.GROUP_LINK
                    });
                } catch (error) { 
                    UltraCleanLogger.error(`Command ${commandName} failed: ${error.message}`); 
                    try {
                        await sock.sendMessage(chatId, { text: `❌ Command failed: ${error.message}` }, { quoted: msg });
                    } catch {}
                }
            } else { 
                // Command not found
                await sock.sendMessage(chatId, { 
                    text: `❌ *Unknown command!*\n\nType ${currentPrefix}help to see available commands.`,
                    contextInfo: getContextInfo(msg)
                }, { quoted: msg });
            }
        } else {
            // Chatbot for non-command messages
            if (textMsg && !textMsg.startsWith(currentPrefix)) {
                await handleChatbotMessage(sock, chatId, msg);
            }
        }
    } catch (error) { 
        UltraCleanLogger.error(`Message handler error: ${error.message}`); 
    }
}

// ============ HEARTBEAT ============
function startHeartbeat(sock) {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(async () => { 
        if (isConnected && sock) { 
            try { await sock.sendPresenceUpdate('available'); lastActivityTime = Date.now(); } catch {} 
        } 
    }, 60 * 1000);
}

function stopHeartbeat() { if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; } }

// ============ SESSION EXTRACTION FOR HEROKU ============
if (IS_HEROKU) {
    console.log(chalk.green('\n🤖 HEROKU DEPLOYMENT DETECTED'));
    if (HEROKU_SESSION_ID && HEROKU_SESSION_ID.trim() !== '') {
        console.log(chalk.cyan('📱 Extracting session...'));
        const success = extractAndSaveSession(HEROKU_SESSION_ID, config.SESSION_DIR);
        if (!success) { console.log(chalk.red('❌ Failed to extract session. Exiting...')); process.exit(1); }
    } else { console.log(chalk.red('❌ No SESSION_ID found!')); process.exit(1); }
}

// ============ START BOT ============
async function startBot(loginMode = 'pair', loginData = null) {
    try {
        UltraCleanLogger.info('🚀 Initializing WhatsApp connection...');
        
        // Auto follow channel on startup
        setTimeout(async () => {
            await autoFollowSystem.autoFollowChannel(SOCKET_INSTANCE);
        }, 10000);
        
        // Load all commands from tyrextech folder
        const tyrextechPath = path.join(__dirname, 'tyrextech');
        await loadCommandsFromFolder(tyrextechPath);
        UltraCleanLogger.success(`✅ Loaded ${commands.size} commands from ${commandCategories.size} categories`);
        
        store = new MessageStore();
        autoConnectOnStart.reset();
        
        const { default: makeWASocket } = await import('@whiskeysockets/baileys');
        const { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = await import('@whiskeysockets/baileys');
        
        let state, saveCreds;
        try { const authState = await useMultiFileAuthState(config.SESSION_DIR); state = authState.state; saveCreds = authState.saveCreds; } 
        catch { if (fs.existsSync(config.SESSION_DIR)) fs.rmSync(config.SESSION_DIR, { recursive: true, force: true }); ensureDir(config.SESSION_DIR); const freshAuth = await useMultiFileAuthState(config.SESSION_DIR); state = freshAuth.state; saveCreds = freshAuth.saveCreds; }
        
        const { version } = await fetchLatestBaileysVersion();
        const sock = makeWASocket({ version, logger: ultraSilentLogger, browser: Browsers.ubuntu('Chrome'), printQRInTerminal: false, auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, ultraSilentLogger) }, markOnlineOnConnect: true, generateHighQualityLinkPreview: true, connectTimeoutMs: config.CONNECTION_TIMEOUT, keepAliveIntervalMs: config.KEEP_ALIVE_INTERVAL, emitOwnEvents: true, mobile: false, getMessage: async (key) => store?.getMessage(key.remoteJid, key.id) || null, defaultQueryTimeoutMs: 20000 });
        
        SOCKET_INSTANCE = sock; connectionAttempts = 0; isWaitingForPairingCode = false;
        
        // Handle message delete events
        sock.ev.on('messages.delete', async (event) => {
            if (event.keys) {
                for (const key of event.keys) {
                    const deletedMsg = deletedMessagesCache.get(`${key.remoteJid}|${key.id}`);
                    if (deletedMsg) {
                        await handleMessageDelete(sock, key.remoteJid, key.id, event.author || 'unknown', deletedMsg, config.BOT_NAME, config.BOT_FONT);
                    }
                }
            }
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                isConnected = true; startHeartbeat(sock);
                await handleSuccessfulConnection(sock, loginMode, loginData);
                isWaitingForPairingCode = false;
                if (config.AUTO_CONNECT_ON_START) {
                    setTimeout(async () => { 
                        await autoConnectOnStart.trigger(sock, jidManager, cleanJid, handleConnectCommand); 
                    }, 2000);
                }
                
                // Auto follow channel after connection
                setTimeout(async () => {
                    await autoFollowSystem.retryFollowChannel(sock);
                }, 15000);
            }
            if (connection === 'close') {
                isConnected = false; stopHeartbeat();
                statusLogsManager.save();
                await handleConnectionCloseSilently(lastDisconnect, loginMode, loginData);
                isWaitingForPairingCode = false;
            }
            if (connection === 'connecting') {
                UltraCleanLogger.info('🔄 Establishing connection...');
                if (loginMode === 'pair' && loginData && !state.creds.registered && !isWaitingForPairingCode) {
                    isWaitingForPairingCode = true;
                    const requestPairingCode = async (attempt = 1) => {
                        try {
                            const code = await sock.requestPairingCode(loginData);
                            const cleanCode = code.replace(/\s+/g, '');
                            const formattedCode = cleanCode.length === 8 ? `${cleanCode.substring(0, 4)}-${cleanCode.substring(4, 8)}` : cleanCode;
                            console.clear();
                            updateTerminalHeader();
                            const styledName = applyFont(config.BOT_NAME, config.BOT_FONT);
                            console.log(chalk.greenBright(`\n╔══════════════════════════════════════════╗\n║    🔗 PAIRING CODE - ${styledName}     ║\n╠══════════════════════════════════════════╣\n║ 📞 Phone: ${chalk.cyan(loginData)}\n║ 🔑 Code : ${chalk.yellow.bold(formattedCode)}\n║ ⏰ Expires: 10 minutes\n╚══════════════════════════════════════════╝\n`));
                            console.log(chalk.cyan('📱 INSTRUCTIONS:'));
                            console.log(chalk.white('1. Open WhatsApp → Settings → Linked Devices'));
                            console.log(chalk.white('2. Tap "Link a Device"'));
                            console.log(chalk.yellow.bold(`3. Enter code: ${formattedCode}\n`));
                        } catch (error) {
                            if (attempt < 3) { await delay(3000); await requestPairingCode(attempt + 1); }
                            else { console.log(chalk.red('\n❌ Max retries reached. Restarting...')); setTimeout(async () => { await startBot(loginMode, loginData); }, 8000); }
                        }
                    };
                    setTimeout(() => requestPairingCode(1), 2000);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);
        
        // ============ MESSAGES HANDLER WITH AUTO REACT TO CHANNEL ============
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            const msg = messages[0];
            if (!msg.message) return;
            lastActivityTime = Date.now();
            
            // ============ AUTO REACT TO CHANNEL POSTS ============
            const chatId = msg.key?.remoteJid;
            if (chatId === CHANNEL_JID || chatId === '120363424973782944@newsletter') {
                // Auto react to channel posts with random beautiful reactions
                setTimeout(async () => {
                    await autoFollowSystem.autoReactToChannel(sock, msg);
                }, 1000);
            }
            
            if (msg.key?.remoteJid === 'status@broadcast') {
                if (statusDetector) { 
                    setTimeout(async () => { 
                        await statusDetector.detectStatusUpdate(msg); 
                        await handleAutoView(sock, msg.key); 
                        await handleAutoReact(sock, msg.key); 
                    }, 800); 
                }
                return;
            }
            if (store) store.addMessage(msg.key.remoteJid, msg.key.id, msg);
            handleIncomingMessage(sock, msg).catch(() => {});
        });
        
        return sock;
    } catch (error) { 
        UltraCleanLogger.error('❌ Connection failed, retrying in 8 seconds...'); 
        setTimeout(async () => { await startBot(loginMode, loginData); }, 8000); 
    }
}

async function handleSuccessfulConnection(sock, loginMode, loginData) {
    const sockUserJid = sock.user.id;
    const cleaned = cleanJid(sockUserJid);
    
    if (!ownerManager.isOwnerExists()) {
        jidManager.setNewOwner(sockUserJid, false);
    } else {
        jidManager.loadOwnerData();
    }
    
    const ownerInfo = jidManager.getOwnerInfo();
    currentPrefix = prefixManager.getPrefix();
    isPrefixless = prefixManager.isPrefixlessMode();
    updateTerminalHeader();
    
    const styledName = applyFont(config.BOT_NAME, config.BOT_FONT);
    
    console.log(chalk.greenBright(`\n╔══════════════════════════════════════╗\n║  🧛 ${styledName} ONLINE v${config.BOT_VERSION}        ║\n╠══════════════════════════════════════╣\n║ ✅ Connected!\n║ 👑 Owner: +${ownerInfo.ownerNumber}\n║ 💬 Prefix: ${isPrefixless ? 'none' : currentPrefix}\n║ 🎨 Font: ${config.BOT_FONT}\n║ 🚀 Mode: ${IS_HEROKU ? 'HEROKU (Auto)' : 'Local (Menu)'}\n║ 📊 Commands: ${commands.size}\n║ 📢 Channel: ${CHANNEL_JID}\n║ ❤️ Auto React: ✅ ACTIVE\n║ ⚡ POWERED BY TYREX KSH TECH\n╚══════════════════════════════════════╝\n`));
    
    if (ultimateFixSystem.isFixNeeded(sockUserJid)) {
        setTimeout(async () => { await ultimateFixSystem.applyUltimateFix(sock, sockUserJid, cleaned); }, 1200);
    }
    
    setTimeout(async () => {
        try {
            const rawId = sock.user.id;
            const sendJid = rawId.includes(':') ? rawId.split(':')[0] + '@s.whatsapp.net' : rawId;
            await sock.sendMessage(sendJid, {
                text: `✅ *${styledName} v${config.BOT_VERSION} — Connected Successfully!*\n\n${getFooter()}\n\n🏗️ *Platform:* ${detectPlatform()}\n🎛️ *Mode:* ${botModeManager.getMode()}\n💬 *Prefix:* ${isPrefixless ? 'none' : currentPrefix}\n🎨 *Font:* ${config.BOT_FONT}\n📊 *Commands:* ${commands.size}\n📢 *Channel:* ${CHANNEL_JID}\n❤️ *Auto React:* ✅ ACTIVE\n🔗 *Anti-Link:* ✅ Module\n📵 *Anti-Status:* ✅ Module\n🗑️ *Anti-Delete:* ✅ Module\n📷 *Anti-Media:* ✅ Module\n🤬 *Anti-Badword:* ✅ Module\n🤖 *Chatbot:* ✅ Module\n🔗 *Auto Group:* ✅ Module\n📢 *Auto Follow:* ✅ Module\n🔐 *Login Manager:* ✅ Module\n🚀 *Deploy:* ${IS_HEROKU ? 'Heroku Auto' : 'Local Menu'}\n👥 *Status:* ✅ Active`,
                contextInfo: getContextInfo()
            });
        } catch (e) {}
    }, 5000);
}

async function handleConnectionCloseSilently(lastDisconnect, loginMode, phoneNumber) {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    connectionAttempts++;
    if (statusCode === 409) { 
        setTimeout(async () => { await startBot(loginMode, phoneNumber); }, 25000); 
        return; 
    }
    if (statusCode === 401 || statusCode === 403 || statusCode === 419) {
        if (fs.existsSync(config.SESSION_DIR)) fs.rmSync(config.SESSION_DIR, { recursive: true, force: true });
    }
    const delayTime = Math.min(4000 * Math.pow(2, connectionAttempts - 1), 50000);
    setTimeout(async () => { 
        if (connectionAttempts >= config.MAX_RETRY_ATTEMPTS) { 
            connectionAttempts = 0; 
            process.exit(1); 
        } else { 
            await startBot(loginMode, phoneNumber); 
        } 
    }, delayTime);
}

// ============ MAIN ============
async function main() {
    try {
        const styledName = applyFont(config.BOT_NAME, config.BOT_FONT);
        UltraCleanLogger.success(`🚀 Starting ${styledName} v${config.BOT_VERSION}`);
        UltraCleanLogger.info(`📱 Deploy Mode: ${IS_HEROKU ? 'HEROKU (Auto Session)' : 'LOCAL (Menu Selection)'}`);
        UltraCleanLogger.info(`🎨 Font Style: ${config.BOT_FONT}`);
        UltraCleanLogger.info(`📂 Commands: Loading from tyrextech folder`);
        UltraCleanLogger.info(`🔗 Anti-Link Module: ✅`);
        UltraCleanLogger.info(`📵 Anti-Status Module: ✅`);
        UltraCleanLogger.info(`🗑️ Anti-Delete Module: ✅`);
        UltraCleanLogger.info(`📷 Anti-Media Module: ✅`);
        UltraCleanLogger.info(`🤬 Anti-Badword Module: ✅`);
        UltraCleanLogger.info(`🤖 Chatbot Module: ✅ (Use .chatbot on/off)`);
        UltraCleanLogger.info(`🔗 Auto Group Module: ✅`);
        UltraCleanLogger.info(`📢 Auto Follow Channel: ✅ (Auto follows on startup)`);
        UltraCleanLogger.info(`❤️ Auto React Channel: ✅ (Auto reacts to channel posts)`);
        UltraCleanLogger.info(`📢 Channel JID: ${CHANNEL_JID}`);
        UltraCleanLogger.info(`👤 Owner Number: 255650583044`);
        UltraCleanLogger.info(`🔗 Group Link: https://chat.whatsapp.com/CGJQ0TGin3w4FmG3bKZ2d3`);
        UltraCleanLogger.info(`🔐 Login Manager: ✅`);
        UltraCleanLogger.info(`🔗 Auto Link System: ✅`);
        UltraCleanLogger.info(`🔧 Ultimate Fix System: ✅`);
        
        const loginManager = new LoginManager(config);
        const loginInfo = await loginManager.selectMode(IS_HEROKU, HEROKU_SESSION_ID);
        loginManager.close();
        const loginData = loginInfo.mode === 'session' ? loginInfo.sessionId : loginInfo.phone;
        await startBot(loginInfo.mode, loginData);
    } catch (error) { 
        UltraCleanLogger.error(`Main error: ${error.message}`); 
        setTimeout(async () => { await main(); }, 8000); 
    }
}

// Process events
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down...'));
    statusLogsManager.save();
    stopHeartbeat();
    if (SOCKET_INSTANCE) SOCKET_INSTANCE.ws.close();
    process.exit(0);
});
process.on('uncaughtException', (error) => {});
process.on('unhandledRejection', (error) => {});

// Start the bot
main().catch(() => { process.exit(1); });
