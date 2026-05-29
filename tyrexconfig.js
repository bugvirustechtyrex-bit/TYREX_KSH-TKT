// ============================================
// TYREX KSH BOT CONFIG - Bot Configuration
// Powered by Tyrex KSH Tech
// ============================================

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'database', 'config.json');

// ============ DEFAULT CONFIGURATION ============
const defaultConfig = {
    // Bot Identity
    BOT_NAME: '༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒',
    BOT_VERSION: '2.0.0',
    BOT_PREFIX: '.',
    
    // Font Style
    BOT_FONT: 'bold',
    
    // Footer Text
    FOOTER_TEXT: '© 𝐓𝐘𝐑𝐄𝐗 𝐊𝐒𝐇 𝐓𝐄𝐂𝐇',
    POWERED_BY: '𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐓𝐲𝐫𝐞𝐱 𝐊𝐒𝐇 𝐓𝐞𝐜𝐡',
    
    // Newsletter/Channel
    NEWSLETTER_JID: '120363424973782944@newsletter',
    NEWSLETTER_NAME: '༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒',
    
    // Media
    BOT_AVATAR_URL: 'https://i.ibb.co/V0x5RCkK/file-00000000b26c720cbac7434c723b3ca4.png',
    BOT_THUMBNAIL_URL: 'https://i.ibb.co/V0x5RCkK/file-00000000b26c720cbac7434c723b3ca4.png',
    
    // Groups
    GROUP_LINK: 'https://chat.whatsapp.com/CGJQ0TGin3w4FmG3bKZ2d3',
    GROUP_NAME: '𝐓𝐘𝐑𝐄𝐗 𝐊𝐒𝐇 𝐓𝐄𝐂𝐇 Community',
    GROUP_INVITE_CODE: 'CGJQ0TGin3w4FmG3bKZ2d3',
    
    // Owner
    OWNER_NUMBER: '255650583044',
    
    // Features
    AUTO_JOIN_ENABLED: true,
    AUTO_VIEW_STATUS: true,
    AUTO_REACT_STATUS: true,
    RATE_LIMIT_ENABLED: true,
    AUTO_CONNECT_ON_LINK: true,
    AUTO_CONNECT_ON_START: true,
    SEND_WELCOME_MESSAGE: true,
    
    // Timeout Settings
    MIN_COMMAND_DELAY: 1000,
    STICKER_DELAY: 2000,
    CONNECTION_TIMEOUT: 40000,
    KEEP_ALIVE_INTERVAL: 15000,
    
    // Max retry attempts
    MAX_RETRY_ATTEMPTS: 10,
    
    // Directories
    SESSION_DIR: './database/sessions',
    DATABASE_DIR: './database',
    CACHE_DIR: './database/cache',
    COMMANDS_DIR: './commands',
    FONTS_DIR: './fonts',
    
    // Deployment
    DEPLOY_MODE: process.env.DEPLOY_MODE || '2',
    SESSION_ID: process.env.SESSION_ID || '',
};

// ============ CONFIG INSTANCE ============
let config = { ...defaultConfig };

// ============ LOAD CONFIG FROM DATABASE ============
function loadConfigFromDatabase() {
    try {
        // Ensure directory exists
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (fs.existsSync(CONFIG_FILE)) {
            const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            config = { ...defaultConfig, ...savedConfig };
            console.log('✅ Config loaded from database');
            console.log(`📢 Bot Name: ${config.BOT_NAME}`);
            console.log(`📢 Channel JID: ${config.NEWSLETTER_JID}`);
            console.log(`👤 Owner Number: ${config.OWNER_NUMBER}`);
            console.log(`👥 Group Link: ${config.GROUP_LINK}`);
        } else {
            // Save default config
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
            config = { ...defaultConfig };
            console.log('✅ Default config created');
            console.log(`👤 Owner Number: ${config.OWNER_NUMBER}`);
            console.log(`👥 Group Link: ${config.GROUP_LINK}`);
        }
    } catch (error) {
        console.error('Error loading config:', error.message);
        config = { ...defaultConfig };
    }
    return config;
}

// ============ SAVE CONFIG TO DATABASE ============
function saveConfigToDatabase() {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error.message);
        return false;
    }
}

// Load config on module load
loadConfigFromDatabase();

// ============ CONFIG UPDATE FUNCTION ============
export function updateConfig(key, value) {
    if (config.hasOwnProperty(key)) {
        const oldValue = config[key];
        config[key] = value;
        
        // Also update process.env for compatibility
        if (process.env[key] !== undefined) {
            process.env[key] = value;
        }
        
        // Save to database
        saveConfigToDatabase();
        
        return { success: true, key, oldValue, newValue: value };
    }
    return { success: false, error: `Config key '${key}' not found` };
}

export function getConfig() {
    return { ...config };
}

export function getConfigValue(key) {
    return config[key] !== undefined ? config[key] : null;
}

export function reloadConfig() {
    return loadConfigFromDatabase();
}

// ============ CONTACT KEY FOR MESSAGES ============
export const fkontak = {
    "key": {
        "participant": '0@s.whatsapp.net',
        "remoteJid": '0@s.whatsapp.net',
        "fromMe": false,
        "id": "Halo"
    },
    "message": {
        "conversation": "𝐓𝐘𝐑𝐄𝐗 𝐊𝐒𝐇 𝐌𝐃"
    }
};

// ============ GET CONTEXT INFO ============
export const getContextInfo = (m, botName = config.BOT_NAME) => {
    return {
        mentionedJid: m && m.sender ? [m.sender] : [],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: config.NEWSLETTER_JID,
            newsletterName: config.NEWSLETTER_NAME,
            serverMessageId: 143,
        },
    };
};

// ============ GET FOOTER ============
export const getFooter = () => {
    return `> ® ${config.POWERED_BY}`;
};

// ============ CHECK IF OWNER ============
export function isOwnerNumber(number) {
    const cleanNumber = number.toString().replace(/[^0-9]/g, '');
    const ownerClean = config.OWNER_NUMBER.toString().replace(/[^0-9]/g, '');
    return cleanNumber === ownerClean;
}

// Export config as default
export default config;
