/**
 * Adani Fintell Suite - Notification System
 * Toast notification handler
 */

'use strict';

console.log('=== notification.js loaded ===');

/**
 * Notification System
 */
const NotificationSystem = {
    container: null,
    notifications: [],
    
    /**
     * Initialize the notification system
     */
    init() {
        // Create notification container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.setAttribute('role', 'region');
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(this.container);
            console.log('Notification container created');
        }
    },
    
    /**
     * Show a notification
     * @param {Object} options - Notification options
     * @param {string} options.type - Type of notification ('success', 'error', 'warning', 'info')
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {number} options.duration - Duration in milliseconds (default: 5000)
     * @param {boolean} options.autoClose - Whether to auto-close (default: true)
     */
    show(options) {
        this.init();
        
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            autoClose = true
        } = options;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        
        // Create notification structure
        notification.innerHTML = `
            <div class="notification-icon">
                ${this.getIcon(type)}
            </div>
            <div class="notification-content">
                ${title ? `<h4 class="notification-title">${this.escapeHtml(title)}</h4>` : ''}
                ${message ? `<p class="notification-message">${this.escapeHtml(message)}</p>` : ''}
            </div>
            <button class="notification-close" type="button" aria-label="Close notification">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
            ${autoClose ? `<div class="notification-progress"><div class="notification-progress-bar" style="animation-duration: ${duration}ms;"></div></div>` : ''}
        `;
        
        // Add to container
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Close button handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.close(notification);
        });
        
        // Auto close
        if (autoClose) {
            setTimeout(() => {
                this.close(notification);
            }, duration);
        }
        
        console.log(`Notification shown: ${type} - ${title}`);
        
        return notification;
    },
    
    /**
     * Close a notification
     * @param {HTMLElement} notification - Notification element to close
     */
    close(notification) {
        if (!notification || !notification.parentElement) return;
        
        notification.classList.add('exiting');
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300); // Match animation duration
    },
    
    /**
     * Close all notifications
     */
    closeAll() {
        const notificationsToClose = [...this.notifications];
        notificationsToClose.forEach(notification => {
            this.close(notification);
        });
    },
    
    /**
     * Get icon SVG for notification type
     * @param {string} type - Notification type
     * @returns {string} SVG icon
     */
    getIcon(type) {
        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>`
        };
        
        return icons[type] || icons.info;
    },
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Convenience methods
     */
    success(title, message, duration = 5000) {
        return this.show({ type: 'success', title, message, duration });
    },
    
    error(title, message, duration = 7000) {
        return this.show({ type: 'error', title, message, duration });
    },
    
    warning(title, message, duration = 6000) {
        return this.show({ type: 'warning', title, message, duration });
    },
    
    info(title, message, duration = 5000) {
        return this.show({ type: 'info', title, message, duration });
    }
};

// Make notification system globally available
window.NotificationSystem = NotificationSystem;

console.log('Notification system ready');
