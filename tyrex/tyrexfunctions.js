// ============================================
// SILA FUNCTIONS - Utility Functions
// Powered by SILA TECH
// ============================================

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Global variables
let isPrefixless = false;
let prefixCache = '.';

// ============ DELAY FUNCTION ============
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============ PLATFORM DETECTION ============
export function detectPlatform() {
    if (process.env.PANEL) return 'Panel';
    if (process.env.HEROKU) return 'Heroku';
    if (process.env.RENDER) return 'Render';
    if (process.env.REPLIT) return 'Replit';
    if (process.env.VERCEL) return 'Vercel';
    if (process.env.DYNO) return 'Heroku';
    return 'Local/VPS';
}

// ============ PREFIX MANAGEMENT ============
export function getCurrentPrefix() { 
    return isPrefixless ? '' : prefixCache; 
}

export function setPrefixless(value) {
    isPrefixless = value;
}

export function setPrefixCache(value) {
    prefixCache = value;
}

export function getPrefixless() {
    return isPrefixless;
}

export function loadPrefixFromFiles(dbDir) {
    const prefixFile = path.join(dbDir, 'prefix.json');
    try {
        if (fs.existsSync(prefixFile)) {
            const config = JSON.parse(fs.readFileSync(prefixFile, 'utf8'));
            if (config.isPrefixless !== undefined) isPrefixless = config.isPrefixless;
            if (config.prefix !== undefined && config.prefix.trim() !== '') return config.prefix.trim();
        }
    } catch (error) {}
    return '.';
}

export function updatePrefixImmediately(newPrefix, dbDir) {
    const oldPrefix = prefixCache;
    const oldIsPrefixless = isPrefixless;
    const isNone = newPrefix === 'none' || newPrefix === '""' || newPrefix === "''" || newPrefix === '';
    
    if (isNone) { 
        isPrefixless = true; 
        prefixCache = ''; 
    } else {
        if (!newPrefix || newPrefix.trim() === '') return { success: false, error: 'Empty prefix' };
        if (newPrefix.length > 5) return { success: false, error: 'Prefix too long' };
        prefixCache = newPrefix.trim(); 
        isPrefixless = false;
    }
    
    const prefixFile = path.join(dbDir, 'prefix.json');
    try {
        fs.writeFileSync(prefixFile, JSON.stringify({ 
            prefix: isNone ? '' : newPrefix, 
            isPrefixless: isNone, 
            setAt: new Date().toISOString() 
        }, null, 2));
    } catch (error) {}
    
    return { 
        success: true, 
        oldPrefix: oldIsPrefixless ? 'none' : oldPrefix, 
        newPrefix: isNone ? 'none' : prefixCache,
        isPrefixless: isPrefixless
    };
}

// ============ JID CLEANER ============
export function cleanJid(jid) {
    if (!jid) return { cleanJid: '', cleanNumber: '', raw: jid, isLid: false };
    const isLid = jid.includes('@lid');
    if (isLid) return { raw: jid, cleanJid: jid, cleanNumber: jid.split('@')[0], isLid: true };
    const [numberPart] = jid.split('@')[0].split(':');
    const serverPart = jid.split('@')[1] || 's.whatsapp.net';
    const cleanNumber = numberPart.replace(/[^0-9]/g, '');
    const normalizedNumber = cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber;
    return { raw: jid, cleanJid: `${normalizedNumber}@${serverPart}`, cleanNumber: normalizedNumber, isLid: false };
}

// ============ FILE OPERATIONS ============
export function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function readJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (error) {}
    return null;
}

export function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

// ============ SESSION EXTRACTION ============
export function extractAndSaveSession(sessionId, sessionDir) {
    if (!sessionId || sessionId.trim() === '') {
        console.log(chalk.red('❌ No SESSION_ID provided'));
        return false;
    }
    
    let sessdata = sessionId.trim();
    if (sessdata.includes('SILA-MD~')) {
        sessdata = sessdata.split('SILA-MD~')[1] || sessdata;
    }
    if (sessdata.includes('VAMPIRE-MD:')) {
        sessdata = sessdata.split('VAMPIRE-MD:')[1] || sessdata;
    }
    sessdata = sessdata.trim();
    
    if (!sessdata) {
        console.log(chalk.red('❌ SESSION_ID is empty after processing'));
        return false;
    }
    
    console.log(chalk.cyan('📥 Extracting session from base64 string...'));
    console.log(chalk.gray(`📊 Session string length: ${sessdata.length} characters`));
    
    try {
        const compressedBuffer = Buffer.from(sessdata, 'base64');
        let sessionBuffer;
        try {
            sessionBuffer = zlib.gunzipSync(compressedBuffer);
            console.log(chalk.green('✅ Session decompressed successfully (gzip format)'));
        } catch (e) {
            console.log(chalk.yellow('⚠️ Session is not compressed, using as plain JSON'));
            sessionBuffer = compressedBuffer;
        }
        
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(sessionDir, 'creds.json'), sessionBuffer);
        console.log(chalk.green("✅ Session extracted and saved successfully"));
        console.log(chalk.gray(`📊 Session size: ${sessionBuffer.length} bytes`));
        
        try {
            const jsonData = JSON.parse(sessionBuffer.toString('utf8'));
            console.log(chalk.green(`✅ Valid session data with keys: ${Object.keys(jsonData).join(', ')}`));
        } catch(e) {
            console.log(chalk.yellow('⚠️ Warning: Session data is not valid JSON'));
        }
        
        return true;
    } catch (err) {
        console.log(chalk.red('❌ Failed to extract session:', err.message));
        return false;
    }
}

// ============ TERMINAL HEADER ============
export function updateTerminalHeader(botName, version, isHeroku, prefixDisplay) {
    const deployModeText = isHeroku ? 'HEROKU (Auto)' : 'Local (Menu)';
    console.clear();
    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════════════╗
║   🧛 ${chalk.bold(`${botName.toUpperCase()} v${version}`)}
║   ⚡ POWERED BY SILA TECH
║   🚀 Deploy Mode: ${deployModeText}
║   💬 Prefix  : ${prefixDisplay}
║   🔧 Auto Fix: ✅ ENABLED
║   🛡️ Rate Limit Protection: ✅ ACTIVE
╚══════════════════════════════════════════════════════════════════════╝
`));
}

// ============ HEARTBEAT ============
export function startHeartbeat(sock, isConnected, setLastActivityTime) {
    let heartbeatInterval;
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(async () => { 
        if (isConnected && sock) { 
            try { 
                await sock.sendPresenceUpdate('available'); 
                if (setLastActivityTime) setLastActivityTime(Date.now());
            } catch {} 
        } 
    }, 60 * 1000);
    return heartbeatInterval;
}

export function stopHeartbeat(heartbeatInterval) { 
    if (heartbeatInterval) { 
        clearInterval(heartbeatInterval); 
        heartbeatInterval = null; 
    } 
}
