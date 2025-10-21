/**
 * Adani Fintell Suite - Keyboard Shortcuts Page
 * Displays all available keyboard shortcuts organized by category
 */

'use strict';

import { KEYBOARD_SHORTCUTS } from '../utils/keyboard-shortcuts.js';
import { PLATFORM } from '../utils/platform-detect.js';

/**
 * Initialize the keyboard shortcuts page
 */
document.addEventListener('DOMContentLoaded', () => {
    renderKeyboardShortcuts();
});

/**
 * Render all keyboard shortcuts grouped by category
 */
function renderKeyboardShortcuts() {
    const gridContainer = document.querySelector('[data-shortcuts-grid]');
    
    if (!gridContainer) {
        console.error('Shortcuts grid container not found');
        return;
    }
    
    // Clear existing content
    gridContainer.innerHTML = '';
    
    // Render each category
    Object.entries(KEYBOARD_SHORTCUTS).forEach(([categoryKey, category]) => {
        const categoryCard = createCategoryCard(categoryKey, category);
        gridContainer.appendChild(categoryCard);
    });
}

/**
 * Create a category card with shortcuts
 * @param {string} categoryKey - Category identifier
 * @param {Object} category - Category data
 * @returns {HTMLElement} - Category card element
 */
function createCategoryCard(categoryKey, category) {
    const card = document.createElement('div');
    card.className = 'shortcut-category';
    card.setAttribute('data-category', categoryKey);
    
    // Category header
    const header = document.createElement('div');
    header.className = 'category-header';
    
    const title = document.createElement('h2');
    title.className = 'category-title';
    
    // Add category icon
    const icon = getCategoryIcon(categoryKey);
    if (icon) {
        title.appendChild(icon);
    }
    
    const titleText = document.createTextNode(category.title);
    title.appendChild(titleText);
    
    header.appendChild(title);
    card.appendChild(header);
    
    // Category body
    const body = document.createElement('div');
    body.className = 'category-body';
    
    // Add shortcuts
    category.shortcuts.forEach(shortcut => {
        const shortcutItem = createShortcutItem(shortcut);
        body.appendChild(shortcutItem);
    });
    
    card.appendChild(body);
    
    return card;
}

/**
 * Create a shortcut item
 * @param {Object} shortcut - Shortcut data
 * @returns {HTMLElement} - Shortcut item element
 */
function createShortcutItem(shortcut) {
    const item = document.createElement('div');
    item.className = 'shortcut-item';
    
    // Description
    const description = document.createElement('div');
    description.className = 'shortcut-description';
    description.textContent = shortcut.description;
    
    // Keys
    const keysContainer = document.createElement('div');
    keysContainer.className = 'shortcut-keys';
    
    // Process and display keys with platform-specific adjustments
    const processedKeys = processKeys(shortcut.keys);
    processedKeys.forEach((key, index) => {
        // Add separator between keys
        if (index > 0) {
            const separator = document.createElement('span');
            separator.className = 'key-separator';
            separator.textContent = '+';
            keysContainer.appendChild(separator);
        }
        
        const keyElement = createKeyElement(key);
        keysContainer.appendChild(keyElement);
    });
    
    item.appendChild(description);
    item.appendChild(keysContainer);
    
    return item;
}

/**
 * Create a key element
 * @param {string} key - Key name
 * @returns {HTMLElement} - Key element
 */
function createKeyElement(key) {
    const keyElement = document.createElement('kbd');
    keyElement.className = 'key';
    
    // Add special classes based on key type
    if (isModifierKey(key)) {
        keyElement.classList.add('key-modifier');
    } else if (isCommandKey(key)) {
        keyElement.classList.add('key-command');
    }
    
    // Add special class for longer keys
    if (key.length > 3) {
        keyElement.classList.add('key-special');
    }
    
    keyElement.textContent = key;
    
    return keyElement;
}

/**
 * Process keys for platform-specific display
 * @param {Array} keys - Array of key names
 * @returns {Array} - Processed key names
 */
function processKeys(keys) {
    return keys.map(key => {
        // Replace Ctrl with Command symbol on Mac
        if (key === 'Ctrl' || key === 'Control') {
            return PLATFORM.isMac ? '⌘' : 'Ctrl';
        }
        
        // Replace Alt with Option symbol on Mac
        if (key === 'Alt') {
            return PLATFORM.isMac ? '⌥' : 'Alt';
        }
        
        // Replace Shift with symbol on Mac
        if (key === 'Shift') {
            return PLATFORM.isMac ? '⇧' : 'Shift';
        }
        
        // Special key symbols
        if (key === 'Enter' || key === 'Return') {
            return PLATFORM.isMac ? '↵' : 'Enter';
        }
        
        if (key === 'Backspace') {
            return PLATFORM.isMac ? '⌫' : 'Backspace';
        }
        
        if (key === 'Delete') {
            return PLATFORM.isMac ? '⌦' : 'Delete';
        }
        
        if (key === 'Tab') {
            return PLATFORM.isMac ? '⇥' : 'Tab';
        }
        
        if (key === 'Esc' || key === 'Escape') {
            return PLATFORM.isMac ? '⎋' : 'Esc';
        }
        
        if (key === 'Space') {
            return PLATFORM.isMac ? '␣' : 'Space';
        }
        
        return key;
    });
}

/**
 * Check if key is a modifier key
 * @param {string} key - Key name
 * @returns {boolean} - True if modifier key
 */
function isModifierKey(key) {
    const modifiers = ['Ctrl', 'Control', '⌘', 'Alt', '⌥', 'Shift', '⇧'];
    return modifiers.includes(key);
}

/**
 * Check if key is a command/special key
 * @param {string} key - Key name
 * @returns {boolean} - True if command key
 */
function isCommandKey(key) {
    const commands = ['Enter', '↵', 'Esc', '⎋', 'Tab', '⇥', 'Space', '␣', 
                      'Backspace', '⌫', 'Delete', '⌦'];
    return commands.includes(key);
}

/**
 * Get category icon SVG
 * @param {string} categoryKey - Category identifier
 * @returns {SVGElement|null} - SVG icon element
 */
function getCategoryIcon(categoryKey) {
    const icons = {
        navigation: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="category-icon">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>`,
        finguard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="category-icon">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>`,
        general: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="category-icon">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>`,
        accessibility: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="category-icon">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
        </svg>`
    };
    
    if (icons[categoryKey]) {
        const template = document.createElement('template');
        template.innerHTML = icons[categoryKey].trim();
        return template.content.firstChild;
    }
    
    return null;
}

// Log page initialization
console.log('Keyboard Shortcuts page initialized', {
    platform: PLATFORM.getPlatformName(),
    modifierKey: PLATFORM.getModifierKey()
});
