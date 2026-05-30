// viewonce-handler.js
export async function setupViewOnce(sock, msg, config) {
    async function streamToBuffer(stream) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
    
    const chatId = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quoted) {
        await sock.sendMessage(chatId, { text: '📸 Reply to a view once image/video with .viewonce' });
        return false;
    }
    
    let buffer, type, caption;
    
    if (quoted.imageMessage?.viewOnce) {
        type = 'image';
        caption = quoted.imageMessage.caption || '';
        const stream = await sock.downloadMediaMessage(quoted);
        buffer = await streamToBuffer(stream);
    }
    else if (quoted.videoMessage?.viewOnce) {
        type = 'video';
        caption = quoted.videoMessage.caption || '';
        const stream = await sock.downloadMediaMessage(quoted);
        buffer = await streamToBuffer(stream);
    }
    
    if (buffer && type) {
        const text = `🔓 *VIEW ONCE*\n📅 ${new Date().toLocaleString()}\n📝 ${caption || 'No caption'}`;
        
        if (type === 'image') {
            await sock.sendMessage(chatId, { image: buffer, caption: text });
        } else {
            await sock.sendMessage(chatId, { video: buffer, caption: text });
        }
        return true;
    }
    
    await sock.sendMessage(chatId, { text: '❌ No view once media found!' });
    return false;
}
