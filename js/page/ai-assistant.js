/**
 * AI Assistant Module
 * Handles AI-powered assistant for FinGuard and SheetSense queries using Google Gemini AI
 */

// Notification System available globally via window.NotificationSystem
// API Endpoints available globally via window.API_ENDPOINTS

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Show notification wrapper
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {string} message - Notification message
 */
function showNotification(type, message) {
    if (window.NotificationSystem) {
        window.NotificationSystem.show({
            type: type,
            title: type.charAt(0).toUpperCase() + type.slice(1),
            message: message
        });
    }
}

// ===================================================================
// STATE MANAGEMENT
// ===================================================================

const state = {
    currentSessionId: null,
    messages: [],
    conversationHistory: [],
    isTyping: false
};

// ===================================================================
// MOCK DATA
// ===================================================================

const MOCK_CONVERSATIONS = [
    {
        session_id: 'sess_today_001',
        title: 'Invoice anomaly analysis',
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        message_count: 8,
        preview: 'Here are the top 5 duplicate invoice anomalies...'
    },
    {
        session_id: 'sess_today_002',
        title: 'GST compliance queries',
        started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        message_count: 5,
        preview: 'The GST validation rate is currently at 94.5%...'
    },
    {
        session_id: 'sess_yesterday_001',
        title: 'Trial balance variance review',
        started_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        message_count: 12,
        preview: 'Found 5 material variances in GL accounts...'
    },
    {
        session_id: 'sess_yesterday_002',
        title: 'Vendor performance comparison',
        started_at: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
        last_updated: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
        message_count: 6,
        preview: 'ABC Suppliers has the highest compliance rate...'
    }
];

// Mock messages for each conversation
const MOCK_CONVERSATION_MESSAGES = {
    'sess_today_001': [
        {
            text: 'Show me top 5 duplicate invoice anomalies',
            type: 'user',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            text: `I found 3 duplicate invoice anomalies:
- Invoice #INV-2024-1234 (₹45,000) - Duplicate of INV-2024-1200
- Invoice #INV-2024-1456 (₹32,500) - Duplicate of INV-2024-1430
- Invoice #INV-2024-1678 (₹28,000) - Duplicate of INV-2024-1650

All duplicates were detected using content-based matching with 95%+ similarity scores.`,
            type: 'bot',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString()
        },
        {
            text: 'Can you provide more details on INV-2024-1234?',
            type: 'user',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000).toISOString()
        },
        {
            text: `Details for Invoice #INV-2024-1234:
- Vendor: ABC Suppliers Ltd
- Amount: ₹45,000
- Date: 2024-01-10
- Status: Flagged as Duplicate
- Original Invoice: INV-2024-1200
- Match Confidence: 97%
- Recommended Action: Review and reject duplicate`,
            type: 'bot',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 63000).toISOString()
        }
    ],
    'sess_today_002': [
        {
            text: 'What is our GST compliance rate?',
            type: 'user',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
            text: `The current GST validation rate is 94.5%. Here's the breakdown:
- Total Invoices Processed: 1,247
- GST Validated: 1,178
- GST Errors: 69

Common issues:
- Invalid GSTIN format: 32 cases
- Wrong GST rate: 21 cases
- Missing IGST on interstate: 16 cases`,
            type: 'bot',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 3000).toISOString()
        },
        {
            text: 'Show me the invoices with GST errors',
            type: 'user',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 120000).toISOString()
        }
    ],
    'sess_yesterday_001': [
        {
            text: 'Analyze the trial balance for variances',
            type: 'user',
            timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString()
        },
        {
            text: `Found 5 material variances in GL accounts:
- GL-1001: Variance of ₹1,25,000 (8% above expected)
- GL-2003: Variance of ₹95,000 (12% below expected)
- GL-3007: Variance of ₹78,000 (6% above expected)
- GL-4012: Variance of ₹1,45,000 (15% above expected)
- GL-5008: Variance of ₹62,000 (9% below expected)

Total material variance: ₹5,05,000`,
            type: 'bot',
            timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000 + 4000).toISOString()
        }
    ],
    'sess_yesterday_002': [
        {
            text: 'Compare vendor performance for this month',
            type: 'user',
            timestamp: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString()
        },
        {
            text: `Vendor Performance Summary:
- ABC Suppliers: 98% compliance (Top Performer)
- XYZ Corp: 87% compliance
- Tech Supplies Ltd: 82% compliance  
- Office Mart: 76% compliance

ABC Suppliers has the highest compliance rate with only 2 issues in 45 invoices.`,
            type: 'bot',
            timestamp: new Date(Date.now() - 32 * 60 * 60 * 1000 + 3500).toISOString()
        },
        {
            text: 'What are the issues with Office Mart?',
            type: 'user',
            timestamp: new Date(Date.now() - 32 * 60 * 60 * 1000 + 90000).toISOString()
        }
    ]
};

// ===================================================================
// DOM ELEMENTS
// ===================================================================

let chatMessagesArea, chatInput, sendBtn, newChatBtn;

// ===================================================================
// INITIALIZATION
// ===================================================================

/**
 * Initialize AI Assistant
 */
function initializeAIAssistant() {
    console.log('Initializing AI Assistant...');
    
    // Get DOM elements
    chatMessagesArea = document.querySelector('.chatbot-messages') || document.getElementById('chatbotMessages');
    chatInput = document.querySelector('.chatbot-input') || document.getElementById('chatbotInput');
    sendBtn = document.querySelector('.send-btn') || document.getElementById('sendBtn');
    newChatBtn = document.querySelector('.new-chat-btn') || document.querySelector('.btn-new-chat') || document.getElementById('newChatBtn');

    if (!chatMessagesArea || !chatInput) {
        console.error('Required AI Assistant elements not found');
        return;
    }

    // Set up event listeners
    setupEventListeners();

    // Load conversation history
    loadConversationHistory();

    // Create new session
    createNewSession();

    console.log('AI Assistant initialized successfully');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Send button
    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    // Input field - Enter key
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // Enable/disable send button based on input
        chatInput.addEventListener('input', () => {
            if (sendBtn) {
                sendBtn.disabled = !chatInput.value.trim();
            }
        });
    }

    // New chat button
    if (newChatBtn) {
        newChatBtn.addEventListener('click', handleNewChat);
    }

    // Suggested query chips
    const queryChips = document.querySelectorAll('.query-chip');
    queryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.dataset.query || chip.textContent.trim();
            console.log('Query chip clicked:', query);
            chatInput.value = query;
            handleSendMessage();
        });
    });

    // Tool buttons
    const exportBtn = document.querySelector('.tool-btn[data-action="export-chat"]');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportChat);
    }
    
    // Existing history items
    const existingHistoryItems = document.querySelectorAll('.history-item');
    existingHistoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Get the parent wrapper if it exists
            const wrapper = this.closest('.history-item-wrapper') || this;
            const sessionId = wrapper.dataset.sessionId;
            
            if (sessionId) {
                // Load the conversation
                loadConversation(sessionId);
            } else {
                // Fallback for items without session ID
                const conversationTitle = this.querySelector('.history-text')?.textContent || 'conversation';
                showNotification('info', `Loaded: ${conversationTitle}`);
            }
        });
    });
    
    // Existing rename buttons
    const existingRenameButtons = document.querySelectorAll('.rename-conversation-btn');
    existingRenameButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const wrapper = this.closest('.history-item-wrapper');
            const sessionId = wrapper?.dataset.sessionId;
            
            if (sessionId && wrapper) {
                handleRenameConversation(sessionId, wrapper);
            }
        });
    });
    
    // Existing delete buttons
    const existingDeleteButtons = document.querySelectorAll('.delete-conversation-btn');
    existingDeleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const wrapper = this.closest('.history-item-wrapper');
            const sessionId = wrapper?.dataset.sessionId;
            
            if (sessionId) {
                handleDeleteConversation(sessionId);
            }
        });
    });
}

/**
 * Set up click handlers for dynamically added conversation items
 */
function setupConversationItemHandler(item, sessionId) {
    item.addEventListener('click', function() {
        loadConversation(sessionId);
    });
}

/**
 * Create a new session
 */
function createNewSession() {
    // Only initialize if not already loaded from localStorage
    if (!state.currentSessionId) {
        // Set current session to the first active conversation or create new
        if (state.conversationHistory.length > 0) {
            state.currentSessionId = state.conversationHistory[0].session_id;
        } else {
            state.currentSessionId = `sess_${Date.now()}`;
        }
    }
}

/**
 * Handle sending a message
 */
async function handleSendMessage() {
    const message = chatInput.value.trim();
    
    console.log('=== AI Assistant - handleSendMessage called ===');
    console.log('Message:', message);
    
    if (!message) {
        console.log('Message is empty, returning');
        return;
    }

    // Clear input
    chatInput.value = '';
    if (sendBtn) {
        sendBtn.disabled = true;
    }

    // Add user message to chat
    addMessage(message, 'user');

    // Show typing indicator
    showTypingIndicator();

    // Send to AI and get response
    try {
        console.log('Calling sendToGeminiAI with message:', message);
        const response = await sendToGeminiAI(message);
        console.log('Received response from AI:', response);
        
        // Hide typing indicator
        hideTypingIndicator();

        // Add bot response
        addMessage(response, 'bot');

        // Save to conversation history
        saveConversationHistory();
        
    } catch (error) {
        console.error('Error getting AI response:', error);
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error processing your request. Please try again.', 'bot');
        showNotification('error', 'Failed to get AI response');
    }

    // Scroll to bottom
    scrollToBottom();
}

/**
 * Handle new chat button click
 */
function handleNewChat() {
    // Generate a new session ID
    const newSessionId = `sess_${Date.now()}`;
    const currentTime = new Date().toISOString();
    
    // Create new conversation object
    const newConversation = {
        session_id: newSessionId,
        title: 'New Conversation',
        started_at: currentTime,
        last_updated: currentTime,
        message_count: 0,
        preview: 'No messages yet'
    };
    
    // Add to conversation history at the beginning
    state.conversationHistory.unshift(newConversation);
    
    // Clear current messages
    if (chatMessagesArea) {
        chatMessagesArea.innerHTML = `
            <div class="message bot-message">
                <div class="message-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>
                <div class="assistant-message">
                    Hello! I'm your Fintell Suite AI Assistant. I can help you with:
                    <ul>
                        <li>Finding specific anomalies in invoices</li>
                        <li>Checking GST compliance issues</li>
                        <li>Analyzing vendor performance</li>
                        <li>Reviewing processed invoices</li>
                        <li>Generating insights and reports</li>
                    </ul>
                    What would you like to know?
                </div>
            </div>
        `;
    }
    
    // Reset state
    state.currentSessionId = newSessionId;
    state.messages = [];
    
    // Add new conversation to sidebar
    renderConversationInSidebar(newConversation);
    
    // Set it as active
    setActiveConversation(newSessionId);
    
    // Focus on input
    if (chatInput) {
        chatInput.focus();
    }
    
    showNotification('success', 'New conversation started');
}

/**
 * Render a conversation in the sidebar
 * @param {Object} conversation - Conversation object
 */
function renderConversationInSidebar(conversation) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    
    // Check if "Today" section exists, if not create it
    let todaySection = chatHistory.querySelector('.history-section');
    if (!todaySection) {
        todaySection = document.createElement('div');
        todaySection.className = 'history-section';
        todaySection.innerHTML = '<h4 class="history-heading">Today</h4>';
        chatHistory.insertBefore(todaySection, chatHistory.firstChild);
    }
    
    // Create new conversation item
    const conversationItem = document.createElement('div');
    conversationItem.className = 'history-item-wrapper';
    conversationItem.dataset.sessionId = conversation.session_id;
    
    const conversationButton = document.createElement('button');
    conversationButton.className = 'history-item';
    conversationButton.innerHTML = `<span class="history-text">${conversation.title}</span>`;
    
    // Create actions container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'conversation-actions';
    
    // Create rename button
    const renameButton = document.createElement('button');
    renameButton.className = 'rename-conversation-btn';
    renameButton.setAttribute('aria-label', 'Rename conversation');
    renameButton.setAttribute('title', 'Rename');
    renameButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
    `;
    
    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-conversation-btn';
    deleteButton.setAttribute('aria-label', 'Delete conversation');
    deleteButton.setAttribute('title', 'Delete');
    deleteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
    `;
    
    // Add click handler for conversation
    conversationButton.addEventListener('click', () => {
        loadConversation(conversation.session_id);
    });
    
    // Add click handler for rename button
    renameButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering conversation load
        handleRenameConversation(conversation.session_id, conversationItem);
    });
    
    // Add click handler for delete button
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering conversation load
        handleDeleteConversation(conversation.session_id);
    });
    
    actionsContainer.appendChild(renameButton);
    actionsContainer.appendChild(deleteButton);
    
    conversationItem.appendChild(conversationButton);
    conversationItem.appendChild(actionsContainer);
    
    // Insert after the heading
    const heading = todaySection.querySelector('.history-heading');
    if (heading && heading.nextSibling) {
        todaySection.insertBefore(conversationItem, heading.nextSibling);
    } else {
        todaySection.appendChild(conversationItem);
    }
}

/**
 * Set active conversation in sidebar
 * @param {string} sessionId - Session ID
 */
function setActiveConversation(sessionId) {
    const allItems = document.querySelectorAll('.history-item');
    allItems.forEach(item => {
        if (item.dataset.sessionId === sessionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Load a conversation
 * @param {string} sessionId - Session ID
 */
async function loadConversation(sessionId) {
    // Find conversation in history
    const conversation = state.conversationHistory.find(c => c.session_id === sessionId);
    if (!conversation) {
        console.error('Conversation not found:', sessionId);
        return;
    }
    
    // Set as current session
    state.currentSessionId = sessionId;
    
    // Set active in sidebar
    setActiveConversation(sessionId);
    
    // Clear current messages
    if (chatMessagesArea) {
        chatMessagesArea.innerHTML = '';
    }
    
    try {
        // Try to load messages from API
        const messages = await loadConversationMessages(sessionId);
        
        // Render messages
        if (messages && messages.length > 0) {
            messages.forEach(message => {
                renderMessage(message);
            });
            
            // Scroll to bottom
            scrollToBottom();
            
            showNotification('success', `Loaded: ${conversation.title}`);
        } else {
            // No messages in conversation
            if (chatMessagesArea) {
                chatMessagesArea.innerHTML = `
                    <div class="message bot-message">
                        <div class="message-avatar">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </div>
                        <div class="assistant-message">
                            This conversation is empty. Start chatting!
                        </div>
                    </div>
                `;
            }
            showNotification('info', `Loaded: ${conversation.title}`);
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
        showNotification('error', 'Failed to load conversation messages');
    }
}

/**
 * Load messages for a conversation
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} Array of message objects
 */
async function loadConversationMessages(sessionId) {
    try {
        // Try API first
        const response = await fetch(`/api/ai-assistant/conversation/${sessionId}/messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // Add authorization header when authentication is implemented
                // 'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.messages) {
                return data.data.messages;
            }
        }
        
        throw new Error('API not available');
        
    } catch (error) {
        console.log('API unavailable, using mock data');
        
        // Fallback to mock data
        if (MOCK_CONVERSATION_MESSAGES[sessionId]) {
            return MOCK_CONVERSATION_MESSAGES[sessionId];
        }
        
        return [];
    }
}

/**
 * Handle deleting a conversation
 * @param {string} sessionId - Session ID to delete
 */
async function handleDeleteConversation(sessionId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Call API to delete conversation
        const response = await fetch(`/api/ai-assistant/conversation/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
                // Add authorization header when authentication is implemented
                // 'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete conversation: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Remove from state
            state.conversationHistory = state.conversationHistory.filter(
                conv => conv.session_id !== sessionId
            );
            
            // Remove from UI
            const conversationElement = document.querySelector(`[data-session-id="${sessionId}"]`);
            if (conversationElement) {
                conversationElement.remove();
            }
            
            // Remove from localStorage
            localStorage.removeItem(`conversation-${sessionId}`);
            
            // Save updated state
            saveConversationHistory();
            
            // If we deleted the active conversation, load another one
            if (state.currentSessionId === sessionId) {
                if (state.conversationHistory.length > 0) {
                    loadConversation(state.conversationHistory[0].session_id);
                } else {
                    // No more conversations, create a new one
                    handleNewChat();
                }
            }
            
            showNotification('success', 'Conversation deleted successfully');
        } else {
            throw new Error(data.error?.message || 'Failed to delete conversation');
        }
        
    } catch (error) {
        console.error('Error deleting conversation:', error);
        
        // Fallback: delete locally even if API fails
        state.conversationHistory = state.conversationHistory.filter(
            conv => conv.session_id !== sessionId
        );
        
        const conversationElement = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (conversationElement) {
            conversationElement.remove();
        }
        
        // Remove from localStorage
        localStorage.removeItem(`conversation-${sessionId}`);
        
        // Save updated state
        saveConversationHistory();
        
        if (state.currentSessionId === sessionId) {
            if (state.conversationHistory.length > 0) {
                loadConversation(state.conversationHistory[0].session_id);
            } else {
                handleNewChat();
            }
        }
        
        showNotification('error', 'Failed to delete conversation. Please try again.');
    }
}

/**
 * Handle renaming a conversation
 * @param {string} sessionId - Session ID to rename
 * @param {HTMLElement} conversationElement - The conversation wrapper element
 */
function handleRenameConversation(sessionId, conversationElement) {
    // Prevent multiple rename operations
    if (conversationElement.classList.contains('editing')) {
        return;
    }
    
    conversationElement.classList.add('editing');
    
    const historyItem = conversationElement.querySelector('.history-item');
    const historyText = historyItem.querySelector('.history-text');
    const currentTitle = historyText.textContent.trim();
    const actionsContainer = conversationElement.querySelector('.conversation-actions');
    
    // Hide actions while editing
    actionsContainer.style.opacity = '0';
    actionsContainer.style.visibility = 'hidden';
    
    // Create rename input container
    const renameContainer = document.createElement('div');
    renameContainer.className = 'rename-input-container';
    
    const renameInput = document.createElement('input');
    renameInput.type = 'text';
    renameInput.className = 'rename-input';
    renameInput.value = currentTitle;
    renameInput.maxLength = 100;
    renameInput.placeholder = 'Enter conversation name...';
    
    const renameActions = document.createElement('div');
    renameActions.className = 'rename-actions';
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.className = 'rename-save-btn';
    saveButton.setAttribute('aria-label', 'Save');
    saveButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    `;
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'rename-cancel-btn';
    cancelButton.setAttribute('aria-label', 'Cancel');
    cancelButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    `;
    
    renameActions.appendChild(saveButton);
    renameActions.appendChild(cancelButton);
    
    renameContainer.appendChild(renameInput);
    renameContainer.appendChild(renameActions);
    
    // Replace history item content
    historyItem.innerHTML = '';
    historyItem.appendChild(renameContainer);
    
    // Focus and select input
    renameInput.focus();
    renameInput.select();
    
    // Handle save
    const saveRename = async () => {
        const newTitle = renameInput.value.trim();
        
        if (!newTitle) {
            showNotification('warning', 'Conversation name cannot be empty');
            renameInput.focus();
            return;
        }
        
        if (newTitle === currentTitle) {
            cancelRename();
            return;
        }
        
        try {
            // Call API to rename conversation
            const response = await fetch(`/api/ai-assistant/conversation/${sessionId}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to rename conversation: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Update in state
                const conversation = state.conversationHistory.find(
                    conv => conv.session_id === sessionId
                );
                if (conversation) {
                    conversation.title = newTitle;
                    conversation.last_updated = new Date().toISOString();
                }
                
                // Save to localStorage
                saveConversationHistory();
                
                // Update UI
                historyItem.innerHTML = `<span class="history-text">${newTitle}</span>`;
                conversationElement.classList.remove('editing');
                actionsContainer.style.opacity = '';
                actionsContainer.style.visibility = '';
                
                showNotification('success', 'Conversation renamed successfully');
            } else {
                throw new Error(data.error?.message || 'Failed to rename conversation');
            }
            
        } catch (error) {
            console.error('Error renaming conversation:', error);
            
            // Fallback: update locally even if API fails
            const conversation = state.conversationHistory.find(
                conv => conv.session_id === sessionId
            );
            if (conversation) {
                conversation.title = newTitle;
                conversation.last_updated = new Date().toISOString();
            }
            
            // Save to localStorage
            saveConversationHistory();
            
            historyItem.innerHTML = `<span class="history-text">${newTitle}</span>`;
            conversationElement.classList.remove('editing');
            actionsContainer.style.opacity = '';
            actionsContainer.style.visibility = '';
            
            showNotification('success', 'Conversation renamed locally (sync may fail)');
        }
    };
    
    // Handle cancel
    const cancelRename = () => {
        historyItem.innerHTML = `<span class="history-text">${currentTitle}</span>`;
        conversationElement.classList.remove('editing');
        actionsContainer.style.opacity = '';
        actionsContainer.style.visibility = '';
    };
    
    // Event listeners
    saveButton.addEventListener('click', saveRename);
    cancelButton.addEventListener('click', cancelRename);
    
    // Enter to save, Escape to cancel
    renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveRename();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelRename();
        }
    });
    
    // Click outside to cancel
    const handleClickOutside = (e) => {
        if (!conversationElement.contains(e.target)) {
            cancelRename();
            document.removeEventListener('click', handleClickOutside);
        }
    };
    
    // Add listener with a small delay to prevent immediate trigger
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 100);
}

/**
 * Legacy delete handler - kept for backwards compatibility
 */
async function legacyHandleDeleteConversation(sessionId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Call API to delete conversation
        const response = await fetch(`/api/ai-assistant/conversation/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
                // Add authorization header when authentication is implemented
                // 'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete conversation: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Remove from state
            state.conversationHistory = state.conversationHistory.filter(
                conv => conv.session_id !== sessionId
            );
            
            // Remove from UI
            const conversationElement = document.querySelector(`[data-session-id="${sessionId}"]`);
            if (conversationElement) {
                conversationElement.remove();
            }
            
            // If we deleted the active conversation, load another one
            if (state.currentSessionId === sessionId) {
                if (state.conversationHistory.length > 0) {
                    loadConversation(state.conversationHistory[0].session_id);
                } else {
                    // No more conversations, create a new one
                    handleNewChat();
                }
            }
            
            showNotification('success', 'Conversation deleted successfully');
        } else {
            throw new Error(data.error?.message || 'Failed to delete conversation');
        }
        
    } catch (error) {
        console.error('Error deleting conversation:', error);
        
        // Fallback: delete locally even if API fails
        state.conversationHistory = state.conversationHistory.filter(
            conv => conv.session_id !== sessionId
        );
        
        const conversationElement = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (conversationElement) {
            conversationElement.remove();
        }
        
        if (state.currentSessionId === sessionId && state.conversationHistory.length > 0) {
            loadConversation(state.conversationHistory[0].session_id);
        } else if (state.conversationHistory.length === 0) {
            handleNewChat();
        }
        
        showNotification('warning', 'Conversation deleted locally (API unavailable)');
    }
}

/**
 * Handle module filter change
 */
/**
 * Handle export chat
 */
function handleExportChat() {
    if (state.messages.length === 0) {
        showNotification('warning', 'No messages to export');
        return;
    }
    
    // Create text content
    let content = `Fintell Suite AI Assistant Chat Export\n`;
    content += `Exported: ${new Date().toLocaleString()}\n`;
    content += `Session: ${state.currentSessionId || 'N/A'}\n`;
    content += `\n${'='.repeat(50)}\n\n`;
    
    state.messages.forEach(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const sender = msg.type === 'user' ? 'You' : 'Assistant';
        content += `[${timestamp}] ${sender}:\n${msg.text}\n\n`;
    });
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('success', 'Chat exported successfully');
}

/**
 * Add a message to the chat
 * @param {string} text - Message text
 * @param {string} type - 'user' or 'bot'
 */
function addMessage(text, type) {
    const messageObj = {
        text,
        type,
        timestamp: new Date().toISOString()
    };

    state.messages.push(messageObj);

    // Render the message
    renderMessage(messageObj);
}

/**
 * Render a message in the chat
 * @param {Object} message - Message object
 */
function renderMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type === 'user' ? 'user-message' : 'bot-message'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = message.type === 'user' 
        ? `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`
        : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'assistant-message';

    // Format the message text with basic markdown-like formatting
    let formattedText = message.text;
    
    // Replace **text** with <strong>text</strong>
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Replace *text* with <em>text</em>
    formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Convert line breaks to <br>
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    // Use innerHTML to preserve formatting
    contentDiv.innerHTML = formattedText;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(message.timestamp);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeSpan);

    if (chatMessagesArea) {
        chatMessagesArea.appendChild(messageDiv);
    }
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    state.isTyping = true;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`;

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'typing-dot';
        dots.appendChild(dot);
    }

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(dots);

    if (chatMessagesArea) {
        chatMessagesArea.appendChild(typingDiv);
    }
    scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    state.isTyping = false;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Send message to AI Assistant API
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} AI response
 */
async function sendToGeminiAI(userMessage) {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Check if it's a standard greeting/response first
    const standardGreetings = [
        'hi', 'hello', 'hey', 'good morning', 'good afternoon', 
        'good evening', 'good night', 'how are you', 'how r u',
        'thanks', 'thank you', 'bye', 'goodbye'
    ];
    
    const isStandardGreeting = standardGreetings.some(greeting => 
        lowerMessage === greeting || lowerMessage.includes(greeting)
    );
    
    if (isStandardGreeting) {
        // Return mock response immediately for standard greetings
        return new Promise((resolve) => {
            setTimeout(() => {
                const response = generateMockAIResponse(userMessage);
                resolve(response);
            }, 500 + Math.random() * 500);
        });
    }
    
    // For other queries, try to call the API first
    try {
        // Use the proper n8n endpoint from API_ENDPOINTS
        const apiEndpoint = window.API_ENDPOINTS.AI_ASSISTANT.SEND_MESSAGE;
        
        // Build request body according to API specification
        const requestBody = {
            message: userMessage,
            session_id: state.currentSessionId || undefined,
            context: "finguard" // Default to finguard, can be made dynamic
        };
        
        console.log('Sending message to AI Assistant:', requestBody);
        console.log('API Endpoint:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('AI Assistant response data:', data);
        
        // Handle the new response format - array with output field
        let responseText = '';
        
        if (Array.isArray(data)) {
            // If response is an array, get the first element's output
            if (data.length > 0 && data[0].output) {
                responseText = data[0].output;
                console.log('Extracted output from array response');
            } else {
                throw new Error('Invalid array response format');
            }
        } else if (data.success && data.data) {
            // Legacy format support - Update session ID if returned
            if (data.data.session_id) {
                state.currentSessionId = data.data.session_id;
                console.log('Updated session ID:', state.currentSessionId);
            }
            
            // Extract response text based on API response format
            if (data.data.content) {
                responseText = data.data.content;
            } else if (data.data.output) {
                responseText = data.data.output;
            } else if (data.data.response) {
                // Fallback to response field if content doesn't exist
                if (typeof data.data.response === 'string') {
                    responseText = data.data.response;
                } else if (data.data.response.text) {
                    responseText = data.data.response.text;
                    
                    // If there's structured data, format it
                    if (data.data.response.data && data.data.response.type) {
                        responseText = formatStructuredResponse(
                            data.data.response.text,
                            data.data.response.data,
                            data.data.response.type
                        );
                    }
                }
            } else if (data.data.message) {
                // Another fallback
                responseText = data.data.message;
            }
        } else {
            console.error('Invalid API response format:', data);
            throw new Error('Invalid API response format');
        }
        
        console.log('Extracted response text:', responseText);
        
        return responseText || 'I received your message but couldn\'t generate a response.';
        
    } catch (error) {
        console.warn('API call failed, using mock response:', error);
        
        // Fallback to mock responses if API fails
        return new Promise((resolve) => {
            setTimeout(() => {
                const response = generateMockAIResponse(userMessage);
                resolve(response);
            }, 800 + Math.random() * 700);
        });
    }
}

/**
 * Format structured response from AI
 * @param {string} text - Response text
 * @param {Object|Array} data - Structured data
 * @param {string} type - Response type (text/list/table/chart)
 * @returns {string} Formatted HTML response
 */
function formatStructuredResponse(text, data, type) {
    let formattedResponse = text + '\n\n';
    
    if (type === 'list' && Array.isArray(data)) {
        formattedResponse += '<ul class="ai-response-list">';
        data.forEach(item => {
            if (typeof item === 'string') {
                formattedResponse += `<li>${item}</li>`;
            } else if (typeof item === 'object') {
                // Format object data
                formattedResponse += '<li><div class="ai-list-item">';
                Object.entries(item).forEach(([key, value]) => {
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    formattedResponse += `<div class="ai-item-field"><strong>${formattedKey}:</strong> ${value}</div>`;
                });
                formattedResponse += '</div></li>';
            }
        });
        formattedResponse += '</ul>';
    } else if (type === 'table' && Array.isArray(data) && data.length > 0) {
        formattedResponse += '<div class="ai-response-table"><table>';
        // Table headers from first object keys
        const headers = Object.keys(data[0]);
        formattedResponse += '<thead><tr>';
        headers.forEach(header => {
            const formattedHeader = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            formattedResponse += `<th>${formattedHeader}</th>`;
        });
        formattedResponse += '</tr></thead><tbody>';
        
        // Table rows
        data.forEach(row => {
            formattedResponse += '<tr>';
            headers.forEach(header => {
                formattedResponse += `<td>${row[header] || '-'}</td>`;
            });
            formattedResponse += '</tr>';
        });
        formattedResponse += '</tbody></table></div>';
    }
    
    return formattedResponse;
}

/**
 * Generate mock AI response based on query pattern
 * @param {string} query - User query
 * @returns {string} Mock response
 */
function generateMockAIResponse(query) {
    const lowerQuery = query.toLowerCase().trim();

    // Greetings
    if (lowerQuery === 'hi' || lowerQuery === 'hello' || lowerQuery === 'hey') {
        return `Hello! I'm your Fintell Suite AI Assistant. How can I help you today? I can assist with:
- Invoice anomaly detection
- GST compliance checks
- Vendor performance analysis
- Financial data insights
- Report generation`;
    }
    
    if (lowerQuery.includes('how are you') || lowerQuery.includes('how r u')) {
        return `I'm functioning perfectly, thank you for asking! I'm here to help you with your financial operations. What would you like to know?`;
    }
    
    if (lowerQuery.includes('good morning')) {
        return `Good morning! Ready to help you with your financial intelligence needs. What can I do for you today?`;
    }
    
    if (lowerQuery.includes('good afternoon')) {
        return `Good afternoon! How can I assist you with your invoices and financial data today?`;
    }
    
    if (lowerQuery.includes('good evening') || lowerQuery.includes('good night')) {
        return `Good evening! I'm here to help with any financial queries you might have. What do you need?`;
    }
    
    if (lowerQuery.includes('thank') || lowerQuery.includes('thanks')) {
        return `You're welcome! Feel free to ask if you need anything else.`;
    }
    
    if (lowerQuery.includes('bye') || lowerQuery === 'goodbye') {
        return `Goodbye! Feel free to return whenever you need assistance with your financial operations.`;
    }

    // Duplicate invoices
    if (lowerQuery.includes('duplicate')) {
        return `I found 3 duplicate invoice anomalies:
- Invoice #INV-2024-1234 (₹45,000) - Duplicate of INV-2024-1200
- Invoice #INV-2024-1456 (₹32,500) - Duplicate of INV-2024-1430
- Invoice #INV-2024-1678 (₹28,000) - Duplicate of INV-2024-1650

All duplicates were detected using content-based matching with 95%+ similarity scores.`;
    }

    // GST mismatches
    if (lowerQuery.includes('gst')) {
        return `Found 5 invoices with GST mismatches:
- INV-2024-1234: Wrong GST rate (18% instead of 12%)
- INV-2024-1567: Invalid GSTIN format
- INV-2024-1890: HSN code mismatch with GST rate
- INV-2024-2123: Missing IGST on interstate transaction
- INV-2024-2456: CGST+SGST exceeds 18%

Total impact: ₹87,500 in potential tax discrepancies.`;
    }

    // High-risk invoices
    if (lowerQuery.includes('high-risk') || lowerQuery.includes('high risk')) {
        return `Identified 7 high-risk invoices from last month:
- 3 invoices with price anomalies (>30% deviation)
- 2 invoices with invalid vendor GSTINs
- 1 invoice with arithmetical errors
- 1 invoice with missing mandatory fields

Total value of high-risk invoices: ₹2,45,000. I recommend immediate review.`;
    }

    // Price anomalies
    if (lowerQuery.includes('price')) {
        return `Detected 6 price anomalies:
- INV-2024-1234: 45% higher than market average
- INV-2024-1567: 38% deviation from historical price
- INV-2024-1890: Unusual price for HSN code 84433100
- INV-2024-2123: 52% above comparable purchases
- INV-2024-2456: Pricing outlier in product category
- INV-2024-2789: Suspicious bulk discount rate

Total potential overcharge: ₹1,25,000.`;
    }

    // Vendor performance
    if (lowerQuery.includes('vendor')) {
        return `Vendor Performance Summary:
- Total Active Vendors: 45
- Top Performer: ABC Suppliers (98% compliance)
- Vendors with Issues: 8
- Average Compliance Score: 87%

Vendors requiring attention:
- XYZ Corp: 3 duplicate invoices
- Tech Supplies Ltd: 5 GST mismatches
- Office Mart: 2 high-risk flags`;
    }

    // Invoice summary
    if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
        return `Invoice Processing Summary:
- Total Processed: 156 invoices
- Successful: 134 (86%)
- Failed: 22 (14%)

Anomaly Breakdown:
- Duplicate Invoices: 8
- GST Mismatches: 12
- Price Anomalies: 15
- High-Risk Invoices: 18

Total Invoice Value: ₹45,67,890`;
    }

    // Last month data
    if (lowerQuery.includes('last month')) {
        return `Last Month's Statistics (December 2024):
- Total Invoices: 142
- Total Value: ₹38,90,450
- Anomalies Detected: 28 (19.7%)
- Average Processing Time: 2.3 minutes
- GST Compliance Rate: 88%

Top Issues:
- Price deviations: 12 cases
- GST errors: 9 cases
- Duplicate entries: 7 cases`;
    }

    // Default response
    return `I can help you with:
- Viewing duplicate invoice anomalies
- Checking GST validation issues
- Analyzing high-risk invoices
- Reviewing price anomalies
- Vendor performance metrics

Please specify what information you'd like to see, or try one of the suggested queries above.`;
}

/**
 * Format timestamp to readable time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        return `${hours}h ago`;
    } else {
        return date.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

/**
 * Scroll messages container to bottom
 */
function scrollToBottom() {
    if (chatMessagesArea) {
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    }
}

/**
 * Save conversation history to localStorage
 */
function saveConversationHistory() {
    try {
        const dataToSave = {
            messages: state.messages,
            conversationHistory: state.conversationHistory,
            currentSessionId: state.currentSessionId,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('ai-assistant-state', JSON.stringify(dataToSave));
        
        // Also save individual conversation messages
        if (state.currentSessionId) {
            localStorage.setItem(`conversation-${state.currentSessionId}`, JSON.stringify(state.messages));
        }
    } catch (error) {
        console.error('Error saving conversation history:', error);
    }
}

/**
 * Load conversation history from localStorage
 */
function loadConversationHistory() {
    try {
        const savedState = localStorage.getItem('ai-assistant-state');
        if (savedState && chatMessagesArea) {
            const data = JSON.parse(savedState);
            
            // Restore state
            state.messages = data.messages || [];
            state.conversationHistory = data.conversationHistory || [...MOCK_CONVERSATIONS];
            state.currentSessionId = data.currentSessionId || null;
            
            // Render conversation history in sidebar
            renderConversationHistorySidebar();
            
            // Render loaded messages (skip welcome message from HTML)
            const existingMessages = chatMessagesArea.querySelectorAll('.message');
            const welcomeMessageCount = existingMessages.length;

            state.messages.slice(welcomeMessageCount).forEach(message => {
                renderMessage(message);
            });
            
            // Set active conversation if exists
            if (state.currentSessionId) {
                setActiveConversation(state.currentSessionId);
            }
        } else {
            // No saved state, load mock conversations
            state.conversationHistory = [...MOCK_CONVERSATIONS];
            renderConversationHistorySidebar();
        }
    } catch (error) {
        console.error('Error loading conversation history:', error);
        // Fallback to mock data
        state.conversationHistory = [...MOCK_CONVERSATIONS];
        renderConversationHistorySidebar();
    }
}

/**
 * Render conversation history in sidebar from state
 */
function renderConversationHistorySidebar() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    
    // Clear existing items (except static ones if any)
    chatHistory.innerHTML = '';
    
    // Group conversations by time
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayConversations = [];
    const yesterdayConversations = [];
    const olderConversations = [];
    
    state.conversationHistory.forEach(conv => {
        const convDate = new Date(conv.last_updated || conv.started_at);
        if (isSameDay(convDate, today)) {
            todayConversations.push(conv);
        } else if (isSameDay(convDate, yesterday)) {
            yesterdayConversations.push(conv);
        } else {
            olderConversations.push(conv);
        }
    });
    
    // Render Today section
    if (todayConversations.length > 0) {
        const todaySection = createConversationSection('Today', todayConversations);
        chatHistory.appendChild(todaySection);
    }
    
    // Render Yesterday section
    if (yesterdayConversations.length > 0) {
        const yesterdaySection = createConversationSection('Yesterday', yesterdayConversations);
        chatHistory.appendChild(yesterdaySection);
    }
    
    // Render Older section
    if (olderConversations.length > 0) {
        const olderSection = createConversationSection('Older', olderConversations);
        chatHistory.appendChild(olderSection);
    }
}

/**
 * Create a conversation section with heading and items
 */
function createConversationSection(heading, conversations) {
    const section = document.createElement('div');
    section.className = 'history-section';
    
    const headingEl = document.createElement('h4');
    headingEl.className = 'history-heading';
    headingEl.textContent = heading;
    section.appendChild(headingEl);
    
    conversations.forEach(conv => {
        const wrapper = document.createElement('div');
        wrapper.className = 'history-item-wrapper';
        wrapper.dataset.sessionId = conv.session_id;
        
        const button = document.createElement('button');
        button.className = 'history-item';
        if (conv.session_id === state.currentSessionId) {
            button.classList.add('active');
        }
        button.innerHTML = `<span class="history-text">${conv.title}</span>`;
        
        // Actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'conversation-actions';
        
        // Rename button
        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-conversation-btn';
        renameBtn.setAttribute('aria-label', 'Rename conversation');
        renameBtn.setAttribute('title', 'Rename');
        renameBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        `;
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-conversation-btn';
        deleteBtn.setAttribute('aria-label', 'Delete conversation');
        deleteBtn.setAttribute('title', 'Delete');
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
        `;
        
        // Event listeners
        button.addEventListener('click', () => loadConversation(conv.session_id));
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleRenameConversation(conv.session_id, wrapper);
        });
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDeleteConversation(conv.session_id);
        });
        
        actionsContainer.appendChild(renameBtn);
        actionsContainer.appendChild(deleteBtn);
        
        wrapper.appendChild(button);
        wrapper.appendChild(actionsContainer);
        section.appendChild(wrapper);
    });
    
    return section;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

/**
 * Clear conversation history
 */
function clearConversationHistory() {
    state.messages = [];
    state.conversationHistory = [];
    state.currentSessionId = null;
    
    // Clear from localStorage
    localStorage.removeItem('chatbot-history'); // Legacy key
    localStorage.removeItem('ai-assistant-state');
    
    // Clear individual conversation caches
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('conversation-')) {
            localStorage.removeItem(key);
        }
    });
    
    // Clear all messages except welcome message
    if (chatMessagesArea) {
        const messages = chatMessagesArea.querySelectorAll('.message');
        messages.forEach((msg, index) => {
            if (index > 0) { // Keep first message (welcome)
                msg.remove();
            }
        });
    }
    
    // Reload with default mock data
    state.conversationHistory = [...MOCK_CONVERSATIONS];
    renderConversationHistorySidebar();

    showNotification('success', 'Chat history cleared');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initializeAIAssistant);

// Export for external use
export { initializeAIAssistant, clearConversationHistory };
