// ============================================
// SILA LOGIN MANAGER - Login, Auto Link & Ultimate Fix
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { extractAndSaveSession, ensureDir, cleanJid, delay } from './tyrexfunctions.js';
import { UltraCleanLogger } from './tyrexmsg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ============ ULTIMATE FIX SYSTEM ============
export class UltimateFixSystem {
    constructor() { 
        this.fixedJids = new Set(); 
        this.fixApplied = false; 
    }
    
    async applyUltimateFix(sock, senderJid, cleaned) {
        try {
            global.OWNER_NUMBER = cleaned.cleanNumber;
            global.OWNER_CLEAN_NUMBER = cleaned.cleanNumber;
            global.OWNER_JID = cleaned.cleanJid;
            global.OWNER_CLEAN_JID = cleaned.cleanJid;
            this.fixedJids.add(senderJid);
            this.fixApplied = true;
            UltraCleanLogger.success(`✅ Ultimate Fix applied: ${cleaned.cleanJid}`);
            return { success: true, jid: cleaned.cleanJid, number: cleaned.cleanNumber, isLid: cleaned.isLid };
        } catch (error) { 
            UltraCleanLogger.error(`Ultimate Fix failed: ${error.message}`); 
            return { success: false, error: 'Fix failed' }; 
        }
    }
    
    isFixNeeded(jid) { 
        return !this.fixedJids.has(jid); 
    }
    
    shouldRunRestartFix(ownerJid, ownerFile) { 
        return fs.existsSync(ownerFile) && this.isFixNeeded(ownerJid); 
    }
}

// ============ AUTO LINK SYSTEM ============
export class AutoLinkSystem {
    constructor(autoJoinEnabled, autoJoinSystem) {
        this.autoConnectEnabled = true;
        this.autoJoinEnabled = autoJoinEnabled;
        this.autoJoinSystem = autoJoinSystem;
        this.linkAttempts = new Map();
        this.MAX_ATTEMPTS = 3;
    }
    
    async shouldAutoLink(sock, msg, jidManager, config) {
        if (!config.AUTO_LINK_ENABLED) return false;
        
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const cleaned = cleanJid(senderJid);
        
        if (!jidManager.owner || !jidManager.owner.cleanNumber) {
            UltraCleanLogger.info(`🔗 New owner detected: ${cleaned.cleanJid}`);
            const result = await this.autoLinkNewOwner(sock, senderJid, cleaned, jidManager, config);
            if (result && this.autoConnectEnabled) {
                setTimeout(async () => { await this.triggerAutoConnect(sock, msg, cleaned); }, 1500);
            }
            return result;
        }
        
        if (msg.key.fromMe) return false;
        if (jidManager.isOwnerSync(msg)) return false;
        
        const currentOwnerNumber = jidManager.owner.cleanNumber;
        if (this.isSimilarNumber(cleaned.cleanNumber, currentOwnerNumber)) {
            if (!jidManager.ownerJids.has(cleaned.cleanJid)) {
                jidManager.ownerJids.add(cleaned.cleanJid);
                jidManager.ownerJids.add(senderJid);
                if (config.AUTO_ULTIMATE_FIX_ENABLED) {
                    setTimeout(async () => { await this.applyFix(sock, senderJid, cleaned); }, 800);
                }
                await this.sendDeviceLinkedMessage(sock, senderJid, cleaned);
                if (this.autoConnectEnabled) {
                    setTimeout(async () => { await this.triggerAutoConnect(sock, msg, cleaned); }, 1500);
                }
                return true;
            }
        }
        return false;
    }
    
    isSimilarNumber(num1, num2) {
        if (!num1 || !num2) return false;
        if (num1 === num2) return true;
        if (num1.includes(num2) || num2.includes(num1)) return true;
        if (num1.length >= 6 && num2.length >= 6) return num1.slice(-6) === num2.slice(-6);
        return false;
    }
    
    async autoLinkNewOwner(sock, senderJid, cleaned, jidManager, config) {
        try {
            const result = jidManager.setNewOwner(senderJid, true);
            if (!result.success) return false;
            
            await this.sendImmediateSuccessMessage(sock, senderJid, cleaned, true, config);
            if (config.AUTO_ULTIMATE_FIX_ENABLED) {
                setTimeout(async () => { await this.applyFix(sock, senderJid, cleaned); }, 1200);
            }
            if (this.autoJoinEnabled && this.autoJoinSystem) {
                setTimeout(async () => { 
                    try { 
                        await this.autoJoinSystem.autoJoinGroup(sock, senderJid, jidManager.owner?.cleanJid, jidManager.owner?.cleanNumber); 
                    } catch (error) {} 
                }, 3000);
            }
            return true;
        } catch { return false; }
    }
    
    async applyFix(sock, senderJid, cleaned) {
        const ultimateFix = new UltimateFixSystem();
        await ultimateFix.applyUltimateFix(sock, senderJid, cleaned);
    }
    
    async triggerAutoConnect(sock, msg, cleaned) {
        try { 
            if (!this.autoConnectEnabled) return; 
            // This will be handled by connect command
        } catch (error) { 
            UltraCleanLogger.error(`Auto-connect failed: ${error.message}`); 
        }
    }
    
    async sendImmediateSuccessMessage(sock, senderJid, cleaned, isFirstUser = false, config) {
        try {
            const styledName = config.applyFont ? config.applyFont(config.BOT_NAME, config.BOT_FONT) : config.BOT_NAME;
            await sock.sendMessage(senderJid, { 
                text: `✅ *${styledName.toUpperCase()} v${config.VERSION} CONNECTED!*\n\n⚡ POWERED BY SILA TECH\n\n${isFirstUser ? '🎉 *FIRST TIME SETUP COMPLETE!*\n\n' : '🔄 *NEW OWNER LINKED!*\n\n'}📋 *YOUR INFORMATION:*\n├─ Your Number: +${cleaned.cleanNumber}\n├─ Device Type: ${cleaned.isLid ? 'Linked Device 🔗' : 'Regular Device 📱'}\n└─ Status: ✅ LINKED SUCCESSFULLY\n\n🎉 *You're all set!*` 
            });
        } catch {}
    }
    
    async sendDeviceLinkedMessage(sock, senderJid, cleaned) {
        try { 
            await sock.sendMessage(senderJid, { 
                text: `📱 *Device Linked Successfully!*\n\n✅ You can now use owner commands from this device.\n🎉 All systems are now active!\n⚡ POWERED BY SILA TECH` 
            }); 
        } catch {}
    }
}

// ============ LOGIN MANAGER ============
export class LoginManager {
    constructor(config) { 
        this.config = config;
        this.rl = readline.createInterface({ input: process.stdin, output: process.stdout }); 
    }
    
    async selectMode(isHeroku, herokuSessionId) {
        if (isHeroku) {
            console.log(chalk.green('\n🤖 HEROKU DEPLOYMENT DETECTED'));
            if (herokuSessionId && herokuSessionId.trim() !== '') {
                console.log(chalk.cyan('📱 Using stored session automatically...'));
                console.log(chalk.green('✅ Session ID found! Authenticating...'));
                return { mode: 'session', sessionId: herokuSessionId };
            } else {
                console.log(chalk.red('❌ No SESSION_ID found in environment variables!'));
                console.log(chalk.yellow('📝 Please add SESSION_ID to your Heroku config vars'));
                console.log(chalk.white('\nPress Ctrl+C to exit and add SESSION_ID'));
                await this.delay(5000);
                process.exit(1);
            }
        }
        
        console.log(chalk.yellow('\n🧛 SILA SMD v' + this.config.VERSION + ' - LOGIN SYSTEM'));
        console.log(chalk.blue('1) Pairing Code Login (Recommended)'));
        console.log(chalk.blue('2) Clean Session & Start Fresh'));
        console.log(chalk.magenta('3) Use Session ID from Environment'));
        const choice = await this.ask('Choose option (1-3, default 1): ');
        
        switch (choice.trim()) {
            case '1': return await this.pairingCodeMode();
            case '2': return await this.cleanStartMode();
            case '3': return await this.sessionIdMode();
            default: return await this.pairingCodeMode();
        }
    }
    
    async sessionIdMode() {
        let sessionId = this.config.SESSION_ID;
        if (!sessionId || sessionId.trim() === '') {
            const input = await this.ask('\nWould you like to:\n1) Paste Session ID now\n2) Go back to main menu\nChoice (1-2): ');
            if (input.trim() === '1') { 
                sessionId = await this.ask('Paste your Session ID (SILA-MD~... or base64): '); 
                if (!sessionId || sessionId.trim() === '') return await this.selectMode();
            } else return await this.selectMode();
        }
        try { 
            const success = extractAndSaveSession(sessionId, this.config.SESSION_DIR);
            if (success) return { mode: 'session', sessionId: sessionId.trim() };
            throw new Error('Failed to extract session');
        } catch { 
            console.log(chalk.yellow('📝 Falling back to pairing code mode...')); 
            return await this.pairingCodeMode(); 
        }
    }
    
    async pairingCodeMode() {
        console.log(chalk.cyan('\n📱 PAIRING CODE LOGIN'));
        const phone = await this.ask('Phone number (with country code, no +): ');
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (!cleanPhone || cleanPhone.length < 10) { 
            console.log(chalk.red('❌ Invalid phone number')); 
            return await this.selectMode(); 
        }
        return { mode: 'pair', phone: cleanPhone };
    }
    
    async cleanStartMode() {
        const confirm = await this.ask('This will delete all session data. Are you sure? (y/n): ');
        if (confirm.toLowerCase() === 'y') { 
            if (fs.existsSync(this.config.SESSION_DIR)) {
                fs.rmSync(this.config.SESSION_DIR, { recursive: true, force: true });
            }
            ensureDir(this.config.SESSION_DIR);
            return await this.pairingCodeMode(); 
        }
        return await this.pairingCodeMode();
    }
    
    ask(question) { 
        return new Promise((resolve) => { 
            this.rl.question(chalk.yellow(question), resolve); 
        }); 
    }
    
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    close() { 
        if (this.rl) this.rl.close(); 
    }
}

// ============ AUTO CONNECT ON START ============
export class AutoConnectOnStart {
    constructor(autoConnectEnabled) { 
        this.hasRun = false; 
        this.isEnabled = autoConnectEnabled; 
    }
    
    async trigger(sock, jidManager, cleanJidFunc, handleConnectCommand) {
        try {
            if (!this.isEnabled || this.hasRun) return;
            if (!sock || !sock.user?.id) return;
            const ownerJid = sock.user.id;
            const cleaned = cleanJidFunc(ownerJid);
            const mockMsg = { 
                key: { remoteJid: ownerJid, fromMe: true, id: 'auto-start-' + Date.now(), participant: ownerJid }, 
                message: { conversation: '.connect' } 
            };
            await delay(2000);
            await handleConnectCommand(sock, mockMsg, [], cleaned);
            this.hasRun = true;
        } catch (error) { 
            UltraCleanLogger.error(`Auto-connect on start failed: ${error.message}`); 
        }
    }
    
    reset() { 
        this.hasRun = false; 
    }
}

export default {
    UltimateFixSystem,
    AutoLinkSystem,
    LoginManager,
    AutoConnectOnStart
};
