#!/usr/bin/env node
// ============================================
// SILA SMD - Premium WhatsApp Bot
// Bootloader - Starts the bot
// Powered by SILA TECH
// ============================================

import dotenv from 'dotenv';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: './.env' });

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Console clear and banner
console.clear();

// Display startup banner
console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════════════╗
║  ███████╗██╗██╗      █████╗     ███████╗███╗   ███╗██████╗         ║
║  ██╔════╝██║██║     ██╔══██╗    ██╔════╝████╗ ████║██╔══██╗        ║
║  ███████╗██║██║     ███████║    ███████╗██╔████╔██║██║  ██║        ║
║  ╚════██║██║██║     ██╔══██║    ╚════██║██║╚██╔╝██║██║  ██║        ║
║  ███████║██║███████╗██║  ██║    ███████║██║ ╚═╝ ██║██████╔╝        ║
║  ╚══════╝╚═╝╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝     ╚═╝╚═════╝         ║
║                                                                      ║
║                   ███████╗███╗   ███╗██████╗                         ║
║                   ██╔════╝████╗ ████║██╔══██╗                        ║
║                   ███████╗██╔████╔██║██║  ██║                        ║
║                   ╚════██║██║╚██╔╝██║██║  ██║                        ║
║                   ███████║██║ ╚═╝ ██║██████╔╝                        ║
║                   ╚══════╝╚═╝     ╚═╝╚═════╝                         ║
║                                                                      ║
║   🧛 SILA SMD v1.0.0 - Premium WhatsApp Bot                         ║
║   ⚡ POWERED BY SILA TECH                                            ║
╚══════════════════════════════════════════════════════════════════════╝
`));

// Check deployment mode
const DEPLOY_MODE = process.env.DEPLOY_MODE || '2';
const IS_HEROKU = DEPLOY_MODE === '1' || process.env.DYNO !== undefined;

console.log(chalk.green(`\n🚀 Booting SILA SMD...`));
console.log(chalk.blue(`📱 Mode: ${IS_HEROKU ? 'HEROKU (Auto)' : 'LOCAL (Menu)'}`));
console.log(chalk.gray(`📁 Directory: ${__dirname}\n`));

// Import main bot module (sila.js)
import('./tyrex.js').catch((error) => {
    console.error(chalk.red('❌ Failed to start bot:'), error.message);
    process.exit(1);
});
