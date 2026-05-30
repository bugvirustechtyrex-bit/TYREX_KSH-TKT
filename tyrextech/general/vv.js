// ============================================
// COMMAND LOADER - Replace this in your main file
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Command collection
const commands = new Map();

// Load all commands
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    // Read all .js files directly in commands folder
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of files) {
        try {
            const { default: command } = await import(`file://${path.join(commandsPath, file)}`);
            
            if (command && command.name) {
                // Register main command name
                commands.set(command.name, command);
                console.log(`✅ Loaded: ${command.name}`);
                
                // Register aliases
                if (command.alias && Array.isArray(command.alias)) {
                    for (const alias of command.alias) {
                        commands.set(alias, command);
                        console.log(`   └─ Alias: ${alias}`);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Failed to load ${file}:`, error.message);
        }
    }
    
    console.log(`\n📊 Total commands: ${commands.size}\n`);
}

// Message handler
async function handleMessage(sock, msg, config) {
    try {
        const messageText = msg.message?.conversation || 
                           msg.message?.extendedTextMessage?.text || '';
        
        if (!messageText) return;
        
        // Check for prefix
        if (!messageText.startsWith('.')) return;
        
        const args = messageText.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        console.log(`📝 Command received: ${commandName}`);
        console.log(`   Args: ${args.join(', ') || 'none'}`);
        
        const command = commands.get(commandName);
        
        if (!command) {
            console.log(`❌ Command not found: ${commandName}`);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *Unknown command: ${commandName}*\n\nType .help to see available commands.`
            }, { quoted: msg });
            return;
        }
        
        console.log(`✅ Executing: ${command.name}`);
        await command.execute(sock, msg, args, '.', config);
        
    } catch (error) {
        console.error('Handler error:', error);
    }
}

export { commands, loadCommands, handleMessage };
