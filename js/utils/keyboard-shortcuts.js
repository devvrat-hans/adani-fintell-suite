/**
 * Adani-Fintell-Suite - Keyboard Shortcuts Configuration
 * Centralized keyboard shortcuts definitions
 */

'use strict';

import { PLATFORM } from './platform-detect.js';

/**
 * Keyboard shortcuts organized by category
 */
export const KEYBOARD_SHORTCUTS = {
    navigation: {
        title: 'Navigation',
        shortcuts: [
            {
                keys: ['Alt', 'D'],
                description: 'Go to Dashboard',
                action: () => window.location.href = 'dashboard.html'
            },
            {
                keys: ['Alt', 'F'],
                description: 'Go to FinGuard AI',
                action: () => window.location.href = 'finguard.html'
            },
            {
                keys: ['Alt', 'P'],
                description: 'Go to Profile',
                action: () => window.location.href = 'profile.html'
            },
            {
                keys: ['Alt', 'H'],
                description: 'Toggle Help Menu',
                action: () => document.querySelector('[data-action="toggle-help"]')?.click()
            }
        ]
    },
    finguard: {
        title: 'FinGuard AI',
        shortcuts: [
            {
                keys: ['Ctrl', 'U'],
                description: 'Upload Invoice',
                action: () => document.querySelector('[data-action="browse-file"]')?.click()
            },
            {
                keys: ['Ctrl', 'Enter'],
                description: 'Process Invoice',
                action: () => document.querySelector('[data-action="process-file"]')?.click()
            },
            {
                keys: ['Ctrl', 'R'],
                description: 'Remove Selected File',
                action: () => document.querySelector('[data-action="remove-file"]')?.click()
            },
            {
                keys: ['Ctrl', 'C'],
                description: 'Copy Results',
                action: () => document.querySelector('[data-action="copy-results"]')?.click()
            }
        ]
    },
    general: {
        title: 'General',
        shortcuts: [
            {
                keys: ['Ctrl', 'K'],
                description: 'Open Command Palette',
                action: () => console.log('Command palette (to be implemented)')
            },
            {
                keys: ['Ctrl', '/'],
                description: 'Toggle Sidebar',
                action: () => document.querySelector('[data-sidebar]')?.classList.toggle('collapsed')
            },
            {
                keys: ['Esc'],
                description: 'Close Modal/Popup',
                action: () => {
                    const popup = document.querySelector('[data-processing-popup][style*="flex"]');
                    if (popup) popup.style.display = 'none';
                }
            },
            {
                keys: ['?'],
                description: 'Show Keyboard Shortcuts',
                action: () => window.location.href = 'keyboard-shortcuts.html'
            }
        ]
    },
    accessibility: {
        title: 'Accessibility',
        shortcuts: [
            {
                keys: ['Tab'],
                description: 'Navigate Forward',
                action: null // Browser default
            },
            {
                keys: ['Shift', 'Tab'],
                description: 'Navigate Backward',
                action: null // Browser default
            },
            {
                keys: ['Enter'],
                description: 'Activate Focused Element',
                action: null // Browser default
            },
            {
                keys: ['Space'],
                description: 'Toggle Checkbox/Button',
                action: null // Browser default
            }
        ]
    }
};

/**
 * Register keyboard event listeners
 */
export function registerKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Check all shortcuts
        Object.values(KEYBOARD_SHORTCUTS).forEach(category => {
            category.shortcuts.forEach(shortcut => {
                if (isShortcutPressed(e, shortcut.keys)) {
                    if (shortcut.action) {
                        e.preventDefault();
                        shortcut.action();
                    }
                }
            });
        });
    });
}

/**
 * Check if a specific keyboard shortcut is pressed
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Array} keys - Array of keys to check
 * @returns {boolean} - True if shortcut matches
 */
function isShortcutPressed(event, keys) {
    const pressedKeys = [];
    
    if (event.ctrlKey || event.metaKey) pressedKeys.push('Ctrl');
    if (event.altKey) pressedKeys.push('Alt');
    if (event.shiftKey) pressedKeys.push('Shift');
    
    const mainKey = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    if (mainKey !== 'Control' && mainKey !== 'Alt' && mainKey !== 'Shift' && mainKey !== 'Meta') {
        pressedKeys.push(mainKey);
    }
    
    // Check if pressed keys match shortcut keys
    if (pressedKeys.length !== keys.length) return false;
    
    return keys.every(key => {
        const normalizedKey = key === 'Ctrl' ? (navigator.platform.includes('Mac') ? 'Meta' : 'Control') : key;
        return pressedKeys.includes(normalizedKey) || pressedKeys.includes(key);
    });
}

/**
 * Get keyboard shortcut display text
 * @param {Array} keys - Array of keys
 * @returns {string} - Display text
 */
export function getShortcutDisplay(keys) {
    return keys.map(key => {
        // Use ⌘ for Mac Command key
        if (key === 'Ctrl') {
            return PLATFORM.getModifierKey();
        }
        return key;
    }).join('+');
}
