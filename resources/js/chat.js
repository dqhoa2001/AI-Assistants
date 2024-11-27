import { marked } from './utils/marked-config';

class ChatManager {
    constructor() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-message');
        this.chatMessages = document.getElementById('chat-messages');
        this.isLoading = false;
        this.clearButton = document.getElementById('clear-history');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.messageInput) {
            this.messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));
        }
        
        if (this.sendButton) {
            this.sendButton.addEventListener('click', this.sendMessage.bind(this));
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', this.handleEnterPress.bind(this));
        }
        
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', this.clearHistory.bind(this));
        }
    }

    decodeHtmlEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex justify-${isUser ? 'end' : 'start'} animate-fade-in`;
        
        const decodedMessage = this.decodeHtmlEntities(message);
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        });

        messageDiv.innerHTML = this.getMessageTemplate(decodedMessage, currentTime, isUser);
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    getMessageTemplate(message, time, isUser) {
        return `
            <div class="max-w-[80%] break-words ${isUser 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'} 
                rounded-xl px-4 py-3 shadow-sm">
                <div class="whitespace-normal text-sm prose dark:prose-invert max-w-none ${isUser 
                    ? 'prose-white prose-pre:text-gray-900' 
                    : 'prose-gray dark:prose-invert'}">
                    ${marked.parse(message)}
                </div>
                <div class="text-xs opacity-70 mt-1">
                    ${time}
                </div>
            </div>
        `;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        const model = document.getElementById('model-select').value;
        if (!message || this.isLoading) return;

        this.isLoading = true;
        this.setInputState(true);
        this.addMessage(message, true);
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        try {
            this.showLoadingIndicator();
            const response = await this.sendMessageToServer(message, model);
            const data = await response.json();
            this.removeLoadingIndicator();
            this.addMessage(data.message);
        } catch (error) {
            this.removeLoadingIndicator();
            this.addMessage('Sorry, something went wrong. Please try again.');
            console.error('Error:', error);
        } finally {
            this.isLoading = false;
            this.setInputState(false);
        }
    }

    setInputState(disabled) {
        this.messageInput.disabled = disabled;
        this.sendButton.disabled = disabled;
        if (!disabled) this.messageInput.focus();
    }

    async sendMessageToServer(message, model) {
        return fetch('/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({ message, model })
        });
    }

    handleEnterPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }

    showLoadingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex justify-start animate-fade-in';
        messageDiv.id = 'loading-indicator';
        
        messageDiv.innerHTML = `
            <div class="max-w-[80%] break-words bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    removeLoadingIndicator() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async clearHistory() {
        if (!confirm('Are you sure you want to clear all chat history?')) return;
        
        try {
            const response = await fetch('/chat/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.chatMessages.innerHTML = '';
                this.addMessage('Chat history cleared successfully', false);
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            this.addMessage('Failed to clear chat history. Please try again.', false);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chat-messages')) {
        new ChatManager();
    }
});
