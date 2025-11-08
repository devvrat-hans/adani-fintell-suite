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

        // Get AI response
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
    }

    addMessage(text, type) {
        const messagesContainer = document.querySelector('.chatbot-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message fade-in`;

        // For bot messages, convert markdown to HTML
        const formattedText = type === 'bot' ? this.markdownToHtml(text) : this.escapeHtml(text);

        if (type === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-text">${formattedText}</div>
                    <span class="message-time">${this.formatTime(new Date())}</span>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p class="message-text">${formattedText}</p>
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
        try {
            console.log('Sending message to AI Assistant API:', userMessage);
            
            // Call the ai-assistant-chat API
            const response = await fetch('https://n8n-n8n.qoezvx.easypanel.host/webhook/f/ai-assistant/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage
                })
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                return 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again in a moment.';
            }

            // Get the response text first
            const responseText = await response.text();
            console.log('Raw response text:', responseText);

            // Check if response is empty
            if (!responseText || responseText.trim() === '') {
                console.error('Empty response from API');
                return 'I apologize, but I received an empty response from the AI service. Please try again.';
            }

            // Parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text that failed to parse:', responseText);
                return 'I apologize, but I received an invalid response from the AI service. Please try again.';
            }

            console.log('AI Assistant API response:', data);

            // Extract the output from the response
            if (data && Array.isArray(data) && data.length > 0 && data[0].output) {
                return data[0].output;
            } else if (data && data.output) {
                // Handle case where response is not wrapped in array
                return data.output;
            } else {
                console.error('Unexpected response format:', data);
                return 'I received a response but couldn\'t understand its format. Please try rephrasing your question.';
            }
        } catch (error) {
            console.error('Error calling AI Assistant API:', error);
            console.error('Error details:', error.message, error.stack);
            // Return a more user-friendly error message
            return 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again in a moment.';
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

    markdownToHtml(text) {
        // Escape HTML first to prevent XSS
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Convert markdown to HTML
        // Bold: **text** or __text__
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Italic: *text* or _text_
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Code: `code`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Line breaks: preserve newlines as <br>
        html = html.replace(/\n/g, '<br>');

        // Lists: convert * or - at start of line to bullet points
        html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
        
        // Wrap consecutive <li> items in <ul>
        html = html.replace(/(<li>.*<\/li>)(<br>)?/g, function(match) {
            return match;
        });
        
        // Group list items
        html = html.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, function(match) {
            return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
        });

        return html;
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
