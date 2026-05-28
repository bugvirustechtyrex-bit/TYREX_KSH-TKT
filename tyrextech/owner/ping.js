export default {
  name: 'ping',
  category: 'owner',
  async execute(sock, msg) {
    const start = Date.now();

    // Tuma message ya kwanza
    const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
      text: `👉 *Pinging...*`
    }, { quoted: msg });

    // Hesabu ping
    const pingTime = Date.now() - start;

    // Edit message na ping time halisi
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🫵 *Pong!* \`${pingTime}ms\`

> *𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*`,
      edit: sentMsg.key
    });
  }
};
