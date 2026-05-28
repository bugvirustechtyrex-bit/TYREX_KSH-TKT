// ============================================
// SILA INDEX - Export all modules
// Powered by SILA TECH
// ============================================

export { isOwnerOrSudo } from './isOwner.js';
export { isAdmin } from './isAdmin.js';
export { isSudo, addSudo, removeSudo, getSudoList } from './isSudo.js';

// Default export
export default {
    isOwnerOrSudo,
    isAdmin,
    isSudo,
    addSudo,
    removeSudo,
    getSudoList
};
