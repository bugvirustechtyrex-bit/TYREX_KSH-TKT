// ============================================
// SILA IS SUDO - Check if user is sudo
// Powered by SILA TECH
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SUDO_FILE = path.join(ROOT_DIR, 'tyrexmd', 'database', 'sudo.json');

// Load sudo users
let sudoUsers = new Set();

function loadSudoUsers() {
    try {
        if (fs.existsSync(SUDO_FILE)) {
            const data = JSON.parse(fs.readFileSync(SUDO_FILE, 'utf8'));
            if (data.users && Array.isArray(data.users)) {
                sudoUsers.clear();
                data.users.forEach(user => sudoUsers.add(user));
            }
        }
    } catch (error) {
        console.error('Error loading sudo users:', error);
    }
}

function saveSudoUsers() {
    try {
        const dir = path.dirname(SUDO_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const data = {
            users: Array.from(sudoUsers),
            updatedAt: new Date().toISOString(),
            count: sudoUsers.size
        };
        fs.writeFileSync(SUDO_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving sudo users:', error);
    }
}

// Load on module load
loadSudoUsers();

export async function isSudo(userId) {
    if (!userId) return false;
    
    // Clean the user ID
    const cleanId = userId.split(':')[0].split('@')[0];
    
    // Check if user is in sudo list
    for (const sudo of sudoUsers) {
        const sudoClean = sudo.split(':')[0].split('@')[0];
        if (sudoClean === cleanId) {
            return true;
        }
    }
    return false;
}

export function addSudo(userId) {
    const cleanId = userId.split(':')[0].split('@')[0];
    sudoUsers.add(cleanId);
    saveSudoUsers();
    return true;
}

export function removeSudo(userId) {
    const cleanId = userId.split(':')[0].split('@')[0];
    sudoUsers.delete(cleanId);
    saveSudoUsers();
    return true;
}

export function getSudoList() {
    return Array.from(sudoUsers);
}

export default { isSudo, addSudo, removeSudo, getSudoList };
