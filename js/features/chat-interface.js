/**
 * Chat Interface
 * Natural language query interface using Gemini AI
 */

import { generateId } from '../utils/helpers.js';
import { formatDateTime } from '../utils/formatters.js';

/**
 * Chat Interface class
 */
export class ChatInterface {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.options = {
            onSend: options.onSend || null,
            placeholder: options.placeholder || 'Ask me anything about your financial data...',
            ...options,
        };
        
        this.messages = [];
        this.init();
    }

    /**
     * Initialize chat interface
     */
    init() {
        this.render();
        this.attachEventListeners();
    }

    /**
     * Render chat interface
     */
    render() {
        this.container.innerHTML = `
            <div class="chat-interface">
                <div class="chat-interface__messages" data-messages></div>
                <div class="chat-interface__input-wrapper">
                    <textarea 
                        class="chat-interface__input" 
                        placeholder="${this.options.placeholder}"
                        rows="1"
                        data-input
                        aria-label="Chat input"
                    ></textarea>
                    <button 
                        class="chat-interface__send-btn" 
                        data-send-btn
                        aria-label="Send message"
                        disabled
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const input = this.container.querySelector('[data-input]');
        const sendBtn = this.container.querySelector('[data-send-btn]');

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 150) + 'px';
            
            // Enable/disable send button
            sendBtn.disabled = input.value.trim().length === 0;
        });

        // Send on button click
        sendBtn.addEventListener('click', () => {
            this.sendMessage(input.value);
            input.value = '';
            input.style.height = 'auto';
            sendBtn.disabled = true;
        });

        // Send on Enter (Shift+Enter for new line)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.value.trim().length > 0) {
                    this.sendMessage(input.value);
                    input.value = '';
                    input.style.height = 'auto';
                    sendBtn.disabled = true;
                }
            }
        });
    }

    /**
     * Send message
     * @param {string} text - Message text
     */
    async sendMessage(text) {
        if (!text.trim()) return;

        const userMessage = {
            id: generateId(),
            type: 'user',
            text: text.trim(),
            timestamp: new Date(),
        };

        this.addMessage(userMessage);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Call onSend callback
            if (this.options.onSend) {
                const response = await this.options.onSend(text.trim());
                this.hideTypingIndicator();
                
                const aiMessage = {
                    id: generateId(),
                    type: 'ai',
                    text: response.text,
                    data: response.data || null,
                    timestamp: new Date(),
                };

                this.addMessage(aiMessage);
            }
        } catch (error) {
            this.hideTypingIndicator();
            console.error('Chat error:', error);
            
            const errorMessage = {
                id: generateId(),
                type: 'ai',
                text: 'Sorry, I encountered an error processing your request. Please try again.',
                error: true,
                timestamp: new Date(),
            };

            this.addMessage(errorMessage);
        }
    }

    /**
     * Add message to chat
     * @param {Object} message - Message object
     */
    addMessage(message) {
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    /**
     * Render message
     * @param {Object} message - Message object
     */
    renderMessage(message) {
        const messagesContainer = this.container.querySelector('[data-messages]');
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message chat-message--${message.type} ${message.error ? 'chat-message--error' : ''}`;
        messageElement.dataset.messageId = message.id;
        messageElement.innerHTML = `
            <div class="chat-message__avatar">
                ${message.type === 'user' ? '👤' : '🤖'}
            </div>
            <div class="chat-message__content">
                <p class="chat-message__text">${this.formatMessageText(message.text)}</p>
                ${message.data ? this.renderMessageData(message.data) : ''}
                <span class="chat-message__timestamp">${formatDateTime(message.timestamp)}</span>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
    }

    /**
     * Format message text (convert markdown-like syntax)
     * @param {string} text - Message text
     * @returns {string} Formatted HTML
     */
    formatMessageText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Render message data (charts, tables, etc.)
     * @param {Object} data - Message data
     * @returns {string} Rendered HTML
     */
    renderMessageData(data) {
        if (data.type === 'table') {
            return this.renderTable(data.table);
        } else if (data.type === 'list') {
            return this.renderList(data.items);
        }
        return '';
    }

    /**
     * Render table
     * @param {Object} table - Table data
     * @returns {string} Table HTML
     */
    renderTable(table) {
        const { headers, rows } = table;
        return `
            <table class="chat-message__table">
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Render list
     * @param {Array} items - List items
     * @returns {string} List HTML
     */
    renderList(items) {
        return `
            <ul class="chat-message__list">
                ${items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = this.container.querySelector('[data-messages]');
        
        const indicator = document.createElement('div');
        indicator.className = 'chat-typing-indicator';
        indicator.dataset.typingIndicator = 'true';
        indicator.innerHTML = `
            <div class="chat-typing-indicator__dot"></div>
            <div class="chat-typing-indicator__dot"></div>
            <div class="chat-typing-indicator__dot"></div>
        `;

        messagesContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const indicator = this.container.querySelector('[data-typing-indicator]');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        const messagesContainer = this.container.querySelector('[data-messages]');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Clear chat history
     */
    clear() {
        this.messages = [];
        const messagesContainer = this.container.querySelector('[data-messages]');
        messagesContainer.innerHTML = '';
    }

    /**
     * Get chat history
     * @returns {Array} Messages array
     */
    getHistory() {
        return this.messages;
    }
}

export default ChatInterface;
