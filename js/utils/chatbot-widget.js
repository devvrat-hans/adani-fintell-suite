/**
 * Chatbot Widget for all pages
 * Floating chat widget that can be added to any page
 */

class ChatbotWidget {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.sessionId = this.getSessionId();
        this.init();
    }

    init() {
        this.loadConversationHistory();
        this.attachEventListeners();
        this.setupSuggestedQueries();
        // Ensure widget starts closed
        this.closeWidget();
    }

    attachEventListeners() {
        // Toggle button
        const toggleBtn = document.getElementById('chatbotToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleWidget());
        }

        // Minimize button
        const minimizeBtn = document.querySelector('.chatbot-minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.closeWidget());
        }

        // Send button
        const sendBtn = document.querySelector('.send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Input field
        const input = document.querySelector('.chatbot-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            input.addEventListener('input', (e) => {
                const sendBtn = document.querySelector('.send-btn');
                if (sendBtn) {
                    sendBtn.disabled = !e.target.value.trim();
                }
            });
        }
    }

    setupSuggestedQueries() {
        const queryChips = document.querySelectorAll('.query-chip');
        queryChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const input = document.querySelector('.chatbot-input');
                if (input) {
                    input.value = chip.textContent;
                    this.sendMessage();
                }
            });
        });
    }

    toggleWidget() {
        if (this.isOpen) {
            this.closeWidget();
        } else {
            this.openWidget();
        }
    }

    openWidget() {
        const widget = document.getElementById('chatbotWidget');
        const toggleBtn = document.getElementById('chatbotToggleBtn');
        
        if (widget && toggleBtn) {
            widget.classList.add('open');
            toggleBtn.classList.add('active');
            this.isOpen = true;
            
            // Focus input
            setTimeout(() => {
                const input = document.querySelector('.chatbot-input');
                if (input) input.focus();
            }, 300);
        }
    }

    closeWidget() {
        const widget = document.getElementById('chatbotWidget');
        const toggleBtn = document.getElementById('chatbotToggleBtn');
        
        if (widget && toggleBtn) {
            widget.classList.remove('open');
            toggleBtn.classList.remove('active');
            this.isOpen = false;
        }
    }

    async sendMessage() {
        const input = document.querySelector('.chatbot-input');
        if (!input || !input.value.trim()) return;

        const userMessage = input.value.trim();
        input.value = '';
        
        // Disable send button
        const sendBtn = document.querySelector('.send-btn');
        if (sendBtn) sendBtn.disabled = true;

        // Add user message to chat
        this.addMessage(userMessage, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get AI response (mock for now)
            const aiResponse = await this.getAIResponse(userMessage);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Add AI response to chat
            this.addMessage(aiResponse, 'bot');

            // Save to history
            this.conversationHistory.push(
                { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
                { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
            );
            
            this.saveConversationHistory();
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            console.error('Chatbot error:', error);
        }
    }

    addMessage(text, type) {
        const messagesContainer = document.querySelector('.chatbot-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message fade-in`;

        if (type === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                </div>
                <div class="message-content">
                    <p class="message-text">${this.escapeHtml(text)}</p>
                    <span class="message-time">${this.formatTime(new Date())}</span>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p class="message-text">${this.escapeHtml(text)}</p>
                    <span class="message-time">${this.formatTime(new Date())}</span>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const messagesContainer = document.querySelector('.chatbot-messages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async getAIResponse(userMessage) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        // Mock responses based on keywords
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('duplicate')) {
            return 'I found 8 duplicate invoices in the last 30 days. The top duplicate is Invoice #INV-2024-1234 with 3 copies, total value ₹45,000. Would you like me to show you more details or export this list?';
        } else if (lowerMessage.includes('gst')) {
            return 'Currently, there are 5 invoices with GST validation issues: 3 with invalid GSTIN format, 1 with incorrect GST rate, and 1 with mismatched HSN code. The most critical one is Invoice #INV-2024-5678 from Vendor ABC Ltd. Would you like to review these invoices?';
        } else if (lowerMessage.includes('high-risk') || lowerMessage.includes('high risk')) {
            return 'I identified 12 high-risk invoices requiring immediate attention. The primary risk factors are: price anomalies (5 invoices), duplicate entries (4 invoices), and GST mismatches (3 invoices). Invoice #INV-2024-9012 has the highest risk score of 8.7/10. Shall I provide a detailed breakdown?';
        } else if (lowerMessage.includes('price') && lowerMessage.includes('anomal')) {
            return 'This month, 7 invoices show price anomalies: 4 are priced 20%+ above market rate, and 3 show unusual quantity-price patterns. The largest deviation is Invoice #INV-2024-3456 from Vendor XYZ with a 35% price increase. Would you like to see the comparison chart?';
        } else if (lowerMessage.includes('vendor') && lowerMessage.includes('performance')) {
            return 'Vendor performance summary: Out of 342 active vendors, 87% have good compliance, 10% need attention, and 3% are flagged for review. Top performing vendor is ABC Supplies Ltd with 98% on-time delivery. Vendors requiring attention: XYZ Corp (multiple anomalies), DEF Industries (GST issues). Need more specific vendor information?';
        } else if (lowerMessage.includes('overview') || lowerMessage.includes('summary')) {
            return 'Last month summary: Processed 1,247 invoices totaling ₹45.67 Cr. Success rate: 96.5%. Detected 43 anomalies (8 duplicates, 15 price issues, 12 GST problems, 8 high-risk). Top spending category: Raw Materials (₹15.23 Cr). Average processing time: 3.2 seconds. Anything specific you\'d like to explore?';
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return 'Hello! I\'m here to help you with invoice analysis, anomaly detection, and compliance checks. You can ask me about duplicate invoices, GST validation, price anomalies, vendor performance, or get a general overview of your financial data. What would you like to know?';
        } else {
            return `I understand you're asking about "${userMessage}". I can help you with invoice anomalies, GST validation, price analysis, vendor performance, and general financial insights. Could you please rephrase your question or try one of the suggested queries?`;
        }
    }

    scrollToBottom() {
        const messagesContainer = document.querySelector('.chatbot-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('chatbot_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('chatbot_session_id', sessionId);
        }
        return sessionId;
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('chatbot_history');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    saveConversationHistory() {
        try {
            // Keep only last 50 messages to avoid localStorage limits
            const recentHistory = this.conversationHistory.slice(-50);
            localStorage.setItem('chatbot_history', JSON.stringify(recentHistory));
        } catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }
}

// Track if chatbot has been initialized
let chatbotInitialized = false;

// Function to initialize chatbot if element exists
function initChatbot() {
    if (chatbotInitialized) {
        return; // Already initialized, skip
    }
    
    const widgetElement = document.getElementById('chatbotWidget');
    if (widgetElement) {
        // Wait a tiny bit to ensure DOM is fully ready
        setTimeout(() => {
            new ChatbotWidget();
            chatbotInitialized = true;
            console.log('Chatbot widget initialized');
        }, 50);
    } else {
        console.log('Chatbot widget element not found, will retry on templatesLoaded');
    }
}

// Initialize chatbot widget when DOM is loaded
document.addEventListener('DOMContentLoaded', initChatbot);

// Also initialize when templates are loaded (for dynamic loading)
document.addEventListener('templatesLoaded', initChatbot);

// Export for module usage
export default ChatbotWidget;
