/**
 * Adani-Fintell-Suite - Keyboard Shortcuts Page JavaScript
 * Displays all available keyboard shortcuts
 */

'use strict';

import { KEYBOARD_SHORTCUTS, getShortcutDisplay, registerKeyboardShortcuts } from '../utils/keyboard-shortcuts.js';
import { PLATFORM } from '../utils/platform-detect.js';

/**
 * Render keyboard shortcuts on the page
 */
function renderShortcuts() {
    const grid = document.getElementById('shortcuts-grid');
    
    if (!grid) return;
    
    // Clear existing content
    grid.innerHTML = '';
    
    // Render each category
    Object.keys(KEYBOARD_SHORTCUTS).forEach(categoryKey => {
        const category = KEYBOARD_SHORTCUTS[categoryKey];
        
        const categoryCard = document.createElement('div');
        categoryCard.className = 'shortcut-category';
        
        // Category title
        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = category.title;
        categoryCard.appendChild(title);
        
        // Shortcuts list
        const shortcutsList = document.createElement('div');
        shortcutsList.className = 'shortcuts-list';
        
        category.shortcuts.forEach(shortcut => {
            const item = document.createElement('div');
            item.className = 'shortcut-item';
            
            // Description
            const description = document.createElement('div');
            description.className = 'shortcut-description';
            description.textContent = shortcut.description;
            item.appendChild(description);
            
            // Keys
            const keysContainer = document.createElement('div');
            keysContainer.className = 'shortcut-keys';
            
            shortcut.keys.forEach((key, index) => {
                // Add separator between keys
                if (index > 0) {
                    const separator = document.createElement('span');
                    separator.className = 'key-separator';
                    separator.textContent = '+';
                    keysContainer.appendChild(separator);
                }
                
                // Create key element
                const keyElement = document.createElement('kbd');
                keyElement.className = 'key';
                
                // Add special class for modifier keys
                const lowerKey = key.toLowerCase();
                
                if (lowerKey === 'ctrl') {
                    keyElement.classList.add(PLATFORM.isMac ? 'key--cmd' : 'key--ctrl');
                    keyElement.textContent = PLATFORM.getModifierKey();
                } else if (lowerKey === 'alt') {
                    keyElement.classList.add('key--alt');
                    keyElement.textContent = 'Alt';
                } else if (lowerKey === 'shift') {
                    keyElement.classList.add('key--shift');
                    keyElement.textContent = 'Shift';
                } else if (lowerKey === 'enter') {
                    keyElement.classList.add('key--enter');
                    keyElement.textContent = 'Enter';
                } else if (lowerKey === 'esc' || lowerKey === 'escape') {
                    keyElement.classList.add('key--esc');
                    keyElement.textContent = 'Esc';
                } else if (lowerKey === 'space') {
                    keyElement.classList.add('key--space');
                    keyElement.textContent = 'Space';
                } else if (lowerKey === 'tab') {
                    keyElement.classList.add('key--tab');
                    keyElement.textContent = 'Tab';
                } else {
                    keyElement.textContent = key;
                }
                
                keysContainer.appendChild(keyElement);
            });
            
            item.appendChild(keysContainer);
            shortcutsList.appendChild(item);
        });
        
        categoryCard.appendChild(shortcutsList);
        grid.appendChild(categoryCard);
    });
}

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    
    if (!isAuthenticated || isAuthenticated !== 'true') {
        console.log('User not authenticated, redirecting to signin');
        window.location.href = 'signin.html';
        return false;
    }
    
    return true;
}

/**
 * Initialize keyboard shortcuts page
 */
function initKeyboardShortcuts() {
    console.log('Keyboard shortcuts page initialized');
    
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }
    
    // Render shortcuts
    renderShortcuts();
    
    // Update platform indicator
    updatePlatformIndicator();
    
    // Register keyboard shortcuts
    registerKeyboardShortcuts();
}

/**
 * Update platform indicator based on user's OS
 */
function updatePlatformIndicator() {
    const indicator = document.querySelector('.platform-indicator');
    if (!indicator) return;
    
    if (PLATFORM.isMac) {
        indicator.innerHTML = `
            <strong>Tip:</strong> You're on ${PLATFORM.getPlatformName()}! All <kbd class="key key--ctrl">Ctrl</kbd> shortcuts 
            are automatically shown as <kbd class="key key--cmd">⌘</kbd> (Command key) for you.
        `;
    } else {
        indicator.innerHTML = `
            <strong>Tip:</strong> On Mac, <kbd class="key key--ctrl">Ctrl</kbd> is replaced 
            with <kbd class="key key--cmd">⌘</kbd> (Command key). You're currently on ${PLATFORM.getPlatformName()}.
        `;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeyboardShortcuts);
} else {
    initKeyboardShortcuts();
}
