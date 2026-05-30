#!/usr/bin/env node
// ============================================
// TYREX KSH MD - WhatsApp Bot
// Bootloader - Starts the bot
// Powered by Tyrex KSH Tech
// ============================================

import dotenv from 'dotenv';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Console clear and banner
console.clear();

// Display startup banner - TYREX KSH TECH THEME
console.log(chalk.red(`
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   ████████╗██╗   ██╗██████╗ ███████╗██╗  ██╗     ██╗██╗███████╗██╗  ██╗████████╗ ║
║   ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝╚██╗██╔╝     ██║██║██╔════╝██║ ██╔╝╚══██╔══╝ ║
║      ██║    ╚████╔╝ ██████╔╝█████╗   ╚███╔╝      ██║██║███████╗█████╔╝    ██║    ║
║      ██║     ╚██╔╝  ██╔══██╗██╔══╝   ██╔██╗ ██   ██║██║╚════██║██╔═██╗    ██║    ║
║      ██║      ██║   ██║  ██║███████╗██╔╝ ██╗╚█████╔╝██║███████║██║  ██╗   ██║    ║
║      ╚═╝      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚════╝ ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝    ║
║                                                                                   ║
║   ██╗  ██╗███████╗██╗  ██╗    ████████╗███████╗ ██████╗██╗  ██╗                  ║
║   ██║ ██╔╝██╔════╝██║  ██║    ╚══██╔══╝██╔════╝██╔════╝██║  ██║                  ║
║   █████╔╝ ███████╗███████║       ██║   █████╗  ██║     ███████║                  ║
║   ██╔═██╗ ╚════██║██╔══██║       ██║   ██╔══╝  ██║     ██╔══██║                  ║
║   ██║  ██╗███████║██║  ██║       ██║   ███████╗╚██████╗██║  ██║                  ║
║   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝       ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝                  ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
`));

console.log(chalk.bold.red(`
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   🧛 ${chalk.white('TYREX KSH MD v2.0.0')} - Premium WhatsApp Bot                        ║
║   ⚡ ${chalk.white('POWERED BY TYREX KSH TECH')}                                          ║
║                                                                                   ║
║   📢 ${chalk.white('Channel:')} 120363424973782944@newsletter                            ║
║   👤 ${chalk.white('Owner:')} 255650583044                                               ║
║   🔗 ${chalk.white('Group:')} https://chat.whatsapp.com/CGJQ0TGin3w4FmG3bKZ2d3          ║
║   ❤️ ${chalk.white('Auto React:')} ACTIVE                                                ║
║   🎨 ${chalk.white('Font Style:')} Bold                                                  ║
║   🔧 ${chalk.white('Anti-Link:')} ✅ ACTIVE                                              ║
║   🤖 ${chalk.white('Chatbot:')} ✅ ACTIVE                                                ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
`));

// Check deployment mode
const DEPLOY_MODE = process.env.DEPLOY_MODE || '2';
const IS_HEROKU = DEPLOY_MODE === '1' || process.env.DYNO !== undefined;

console.log(chalk.green(`\n🚀 Booting TYREX KSH MD...`));
console.log(chalk.blue(`📱 Mode: ${IS_HEROKU ? 'HEROKU (Auto)' : 'LOCAL (Menu)'}`));
console.log(chalk.blue(`🤖 Bot Name: ༒𝐓𝐘𝐑𝐄𝐗_𝐊𝐒𝐇 𝐌𝐃༒`));
console.log(chalk.blue(`📢 Channel: 120363424973782944@newsletter`));
console.log(chalk.blue(`👤 Owner: 255650583044`));
console.log(chalk.blue(`🔗 Group: https://chat.whatsapp.com/CGJQ0TGin3w4FmG3bKZ2d3`));
console.log(chalk.gray(`📁 Directory: ${__dirname}\n`));

// Create empty sila.js if it doesn't exist (for compatibility)
const silaFilePath = './sila.js';
if (!fs.existsSync(silaFilePath)) {
    console.log(chalk.yellow('📝 Creating sila.js for compatibility...'));
    fs.writeFileSync(silaFilePath, `// Auto-generated compatibility file for Heroku\n// TYREX KSH TECH - Premium WhatsApp Bot\nexport default { name: 'TYREX KSH MD', version: '2.0.0' };\n`);
    console.log(chalk.green('✅ sila.js created'));
}

// Import main bot module (index.js directly)
console.log(chalk.cyan('🔄 Loading bot modules...\n'));

import('./index.js').catch((error) => {
    console.error(chalk.red('❌ Failed to start bot:'), error.message);
    console.error(chalk.red(`❌ Error details: ${error.stack || error}`));
    process.exit(1);
});
