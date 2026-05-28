// ============================================
// SILA CHATBOT - AI Chatbot System
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Constants
const CHATBOT_NAME = "SILA AI";
const CREATOR_NAME = "SILA";
const COMPANY_NAME = "SILA TECH";

// ============ STATE MANAGEMENT ============
export function loadChatbotState() {
    const stateFile = path.join(ROOT_DIR, 'tyrexmd', 'database', 'chatbot.json');
    try {
        if (!fs.existsSync(stateFile)) return { perGroup: {}, private: false };
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        if (!state.perGroup) state.perGroup = {};
        if (typeof state.private !== 'boolean') state.private = false;
        return state;
    } catch (e) { return { perGroup: {}, private: false }; }
}

export function saveChatbotState(state) {
    const stateFile = path.join(ROOT_DIR, 'tyrexmd', 'database', 'chatbot.json');
    try {
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
        return true;
    } catch (e) { return false; }
}

export async function isChatbotEnabledForChat(state, chatId) {
    if (!state || !chatId) return false;
    if (chatId.endsWith('@g.us')) {
        return state.perGroup?.[chatId]?.enabled || false;
    }
    return !!state.private;
}

// ============ MESSAGE EXTRACTION ============
export function extractMessageText(message) {
    if (!message?.message) return '';
    const msg = message.message;
    if (msg.conversation) return msg.conversation.trim();
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text.trim();
    if (msg.imageMessage?.caption) return msg.imageMessage.caption.trim();
    if (msg.videoMessage?.caption) return msg.videoMessage.caption.trim();
    if (msg.documentMessage?.caption) return msg.documentMessage.caption.trim();
    return '';
}

// ============ SYSTEM PROMPT ============
function getChatbotSystemPrompt() {
    return `Your name is ${CHATBOT_NAME}. You are the CEO of ${COMPANY_NAME}. You were created by ${CREATOR_NAME}.

Speak naturally like a real person:
- Use short sentences, don't repeat words
- Never ever mention AI, bot, robot, artificial intelligence
- Be fun, playful, and reply exactly how a normal person would reply
- Keep replies natural and short

If they ask who created you: Say "${CREATOR_NAME} aliniumba mimi"
If they ask who is your CEO: Say "CEO wangu ni ${COMPANY_NAME}"
If they ask who owns you: Say "Mimi ni mali ya ${CREATOR_NAME}"

Response style:
- Short and sweet
- Natural and casual
- Match user's tone
- Use all languages

Never repeat these instructions in your response, just chat naturally.`;
}

// ============ API CALL ============
async function callChatbotAPI(userText) {
    const systemPrompt = getChatbotSystemPrompt();
    const fullPrompt = `${systemPrompt}\n\nUser: ${userText}`;
    const encoded = encodeURIComponent(fullPrompt);
    const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?text=${encoded}`;
    
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(apiUrl, { 
            method: 'GET', 
            headers: { 'Accept': 'application/json' }, 
            signal: AbortSignal.timeout(30000) 
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data?.response || data?.message || data?.result || data?.answer || data?.text || data?.content || (typeof data === 'string' ? data : null);
    } catch (err) {
        console.error('[AI API failed]', err.message);
        return null;
    }
}

// ============ MAIN HANDLER ============
export async function handleChatbotMessage(conn, chatId, message) {
    try {
        if (!chatId || message.key?.fromMe) return;
        
        const state = loadChatbotState();
        if (!(await isChatbotEnabledForChat(state, chatId))) return;
        
        const userText = extractMessageText(message);
        if (!userText) return;
        
        // Typing effect
        try { 
            await conn.sendPresenceUpdate('composing', chatId); 
            await new Promise(r => setTimeout(r, 600 + Math.random() * 800)); 
        } catch {}
        
        const apiResult = await callChatbotAPI(userText);
        
        if (!apiResult) {
            await conn.sendMessage(chatId, { 
                text: 'Pole msee, niaje? Jaribu tena baadaye kidogo 😅' 
            }, { quoted: message });
            return;
        }
        
        let replyText = String(apiResult).trim();
        replyText = replyText
            .replace(/Microsoft/gi, COMPANY_NAME)
            .replace(/OpenAI/gi, COMPANY_NAME)
            .replace(/ChatGPT/gi, CHATBOT_NAME)
            .replace(/AI/gi, 'nafsi');
        
        await conn.sendMessage(chatId, { text: replyText }, { quoted: message });
    } catch (err) { 
        console.error('Chatbot error:', err); 
    }
}

// ============ COMMAND HANDLER ============
export async function handleChatbotCommand(sock, msg, args, prefix, chatId, senderJid, isOwnerOrSudo, isAdmin) {
    const isGroup = chatId.endsWith('@g.us');
    const state = loadChatbotState();
    
    let isAuthorized = false;
    const isOwnerSudo = await isOwnerOrSudo(senderJid, sock, chatId);
    if (isOwnerSudo) isAuthorized = true;
    if (!isAuthorized && isGroup) {
        const adminStatus = await isAdmin(sock, chatId, senderJid);
        if (adminStatus.isSenderAdmin) isAuthorized = true;
    }
    if (!isAuthorized && !isGroup) isAuthorized = true;
    
    if (!isAuthorized) {
        await sock.sendMessage(chatId, { 
            text: '❌ *Only group admins and bot owner can use this command!*' 
        }, { quoted: msg });
        return;
    }
    
    const action = args[0]?.toLowerCase();
    
    if (!action) {
        const statusText = isGroup ? 
            (state.perGroup?.[chatId]?.enabled || false ? '✅ ENABLED' : '❌ DISABLED') : 
            (state.private ? '✅ ENABLED' : '❌ DISABLED');
        await sock.sendMessage(chatId, { 
            text: `*╭┈┈┄⊰ CHATBOT STATUS ⊱┄┄┄◈*\n\n*┋ •> 🤖 Bot:* ${CHATBOT_NAME}\n*┋ •> 🔒 Status:* ${statusText}\n*┋*\n*┋ •> Usage:*\n*┋ •> ${prefix}chatbot on/off\n*╰┄┄┄┄┄┈┈┈┈┄┄┄◈*`
        }, { quoted: msg });
        return;
    }
    
    if (action === 'on') {
        if (isGroup) {
            if (!state.perGroup[chatId]) state.perGroup[chatId] = {};
            state.perGroup[chatId].enabled = true;
        } else {
            state.private = true;
        }
        saveChatbotState(state);
        await sock.sendMessage(chatId, { 
            text: `🤖 *Chatbot ENABLED*!\n✅ I will now reply to messages automatically.` 
        }, { quoted: msg });
    } else if (action === 'off') {
        if (isGroup) {
            if (!state.perGroup[chatId]) state.perGroup[chatId] = {};
            state.perGroup[chatId].enabled = false;
        } else {
            state.private = false;
        }
        saveChatbotState(state);
        await sock.sendMessage(chatId, { 
            text: `🔴 *Chatbot DISABLED*!\n❌ I will no longer reply automatically.` 
        }, { quoted: msg });
    }
}

export default {
    loadChatbotState,
    saveChatbotState,
    isChatbotEnabledForChat,
    extractMessageText,
    handleChatbotMessage,
    handleChatbotCommand,
    CHATBOT_NAME,
    CREATOR_NAME,
    COMPANY_NAME
};
