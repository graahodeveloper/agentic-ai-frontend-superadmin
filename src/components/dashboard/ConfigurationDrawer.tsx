import React, { useState } from 'react';
import { User } from '@/types/auth';
import { UserCreatedAgent } from '@/features/user/userApi';
import StepCard from './WebStepCard';
import UserCreatedAgentContextDrawer from './UserCreatedAgentContextDrawer';
import { AgentInstance } from '@/features/agentTemplateApi/agentTemplateApi';

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentInstance;
  currentUserSession?: User;
  onShowChatWidget?: (agent: AgentInstance) => void;
  setSuccessMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setErrorMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  
}

const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen,
  onClose,
  agent,
  currentUserSession,
  onShowChatWidget,
  setSuccessMessages,
  setErrorMessages,
}) => {
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [isCopySuccess, setIsCopySuccess] = useState(false);
  
  // Updated to check instance_config first, then activation_data as fallback
  const getContextFromAgent = (agent: AgentInstance): boolean => {
    const instanceContext = agent.instance_config?.context;
    const activationContext = agent.activation_data?.context;
    const context = instanceContext || activationContext;
    return !!(context && context.trim() !== '');
  };

  // Initialize hasContext based on agent's instance_config or activation_data
  const [hasContext, setHasContext] = useState<boolean>(getContextFromAgent(agent));

  // Function to get AI base URL based on environment
  const getAIBaseURL = (): string => {
    const environment = process.env.NEXT_PUBLIC_ENV;
    switch (environment) {
      case 'demo':
        return process.env.NEXT_PUBLIC_DEMO_AI_BASE_URL || '';
      case 'dev':
        return process.env.NEXT_PUBLIC_DEV_AI_BASE_URL || '';
      default:
        return process.env.NEXT_PUBLIC_DEV_AI_BASE_URL || '';
    }
  };


  // Generate chat widget code
  const generateChatWidgetCode = (agent: AgentInstance) => {
    const subId = currentUserSession?.sub_id || '';
    const agentId = agent.id;
    const baseUrl = getAIBaseURL();
    return `<div class="chat-system">
      <!-- Floating Chat Icon -->
      <div class="chat-icon" id="chatIcon">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <div class="notification-badge" id="notificationBadge">1</div>
      </div>
      <!-- Chat Window -->
      <div class="chat-window" id="chatWindow">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">${agent.name.substring(0, 2).toUpperCase()}</div>
            <div>
              <h4 class="chat-title">${agent.name}</h4>
              <p class="chat-subtitle">We're here to help</p>
            </div>
          </div>
          <button class="chat-close" id="chatClose">&times;</button>
        </div>
        <!-- Chat Messages -->
        <div class="chat-messages" id="chatMessages">
          <div class="welcome-message">
            <div class="welcome-icon">💬</div>
            <h3 class="welcome-title">Welcome to ${agent.name}!</h3>
            <p class="welcome-text">Hi there! How can I help you today? Feel free to ask me anything.</p>
          </div>
        </div>
        <!-- Typing Indicator -->
        <div class="typing-indicator" id="typingIndicator">
          <div class="typing-dots">
            <span>AI Agent is typing</span>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
        <!-- Chat Input -->
        <div class="chat-input">
          <div class="input-container">
            <textarea
              class="message-input"
              id="messageInput"
              placeholder="Type your message..."
              rows="1"
            ></textarea>
            <button class="send-button" id="sendButton">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <style>
        /* Chat System Styles */
        .chat-system {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: 'Arial', sans-serif;
        }
        .chat-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .chat-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
        }
        .chat-icon svg {
          width: 28px;
          height: 28px;
          fill: white;
          transition: transform 0.3s ease;
        }
        .chat-icon.active svg {
          transform: rotate(180deg);
        }
        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 20px;
          height: 20px;
          background: #ff4757;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
        }
        .chat-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 530px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          display: none;
          flex-direction: column;
          overflow: hidden;
          transform: translateY(20px);
          opacity: 0;
          transition: all 0.3s ease;
        }
        .chat-window.active {
          display: flex;
          transform: translateY(0);
          opacity: 1;
        }
        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chat-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
        .chat-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          padding: 0;
          line-height: 1.2;
          color: white;
        }
        .chat-subtitle {
          font-size: 12px;
          opacity: 0.9;
          margin: 0;
          padding: 0;
          line-height: 1.2;
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.8);
        }
        .chat-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: background 0.3s ease;
        }
        .chat-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: #f8f9fa;
        }
        .message {
          margin-bottom: 15px;
          display: flex;
          gap: 10px;
        }
        .message.user {
          flex-direction: row-reverse;
        }
        .message-bubble {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
          position: relative;
        }
        .message.bot .message-bubble {
          background: #e9ecef;
          color: #333;
          border-bottom-left-radius: 6px;
        }
        .message.user .message-bubble {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom-right-radius: 6px;
        }
        .message-time {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 5px;
          text-align: right;
        }
        .message.bot .message-time {
          text-align: left;
        }
        .typing-indicator {
          display: none;
          padding: 15px 20px;
          background: white;
        }
        .typing-dots {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .typing-dot {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          30% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        .chat-input {
          background: white;
          padding: 20px;
          border-top: 1px solid #e9ecef;
        }
        .input-container {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .message-input {
          flex: 1;
          border: 2px solid #e9ecef;
          border-radius: 20px;
          padding: 12px 16px 15px 16px;
          font-size: 14px;
          outline: none;
          resize: none;
          min-height: 20px;
          max-height: 80px;
          transition: border-color 0.3s ease;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .message-input::-webkit-scrollbar {
          display: none;
        }
        .message-input:focus {
          border-color: #667eea;
        }
        .send-button {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .send-button:hover {
          transform: scale(1.1);
        }
        .send-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        .welcome-message {
          text-align: center;
          padding: 30px 20px;
          color: #666;
        }
        .welcome-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        .welcome-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }
        .welcome-text {
          font-size: 14px;
          line-height: 1.5;
        }
        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 8px;
          margin: 10px 20px;
          font-size: 14px;
          border-left: 4px solid #c62828;
        }
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        @media (max-width: 768px) {
          .chat-window {
            width: 90vw;
            height: 70vh;
            right: 5vw;
            bottom: 90px;
          }
          .chat-system {
            right: 15px;
            bottom: 15px;
          }
        }
      </style>
      <script>
        function ChatSystem() {
          this.isOpen = false;
          this.messages = [];
          this.apiEndpoint = '${baseUrl}/api/chat';
          this.sessionId = this.generateSessionId();
          this.subId = "${subId}";
          this.agentId = "${agentId}";
          this.initializeElements();
          this.attachEventListeners();
          this.showNotificationBadge();
        }
        ChatSystem.prototype.initializeElements = function() {
          this.chatIcon = document.getElementById('chatIcon');
          this.chatWindow = document.getElementById('chatWindow');
          this.chatClose = document.getElementById('chatClose');
          this.chatMessages = document.getElementById('chatMessages');
          this.messageInput = document.getElementById('messageInput');
          this.sendButton = document.getElementById('sendButton');
          this.typingIndicator = document.getElementById('typingIndicator');
          this.notificationBadge = document.getElementById('notificationBadge');
        };
        ChatSystem.prototype.attachEventListeners = function() {
          var self = this;
          this.chatIcon.addEventListener('click', function() {
            self.toggleChat();
          });
          this.chatClose.addEventListener('click', function() {
            self.closeChat();
          });
          this.sendButton.addEventListener('click', function() {
            self.sendMessage();
          });
          this.messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              self.sendMessage();
            }
          });
          this.messageInput.addEventListener('input', function() {
            self.autoResizeTextarea();
          });
          document.addEventListener('click', function(e) {
            if (e.target.classList.contains('quick-action-btn')) {
              var message = e.target.getAttribute('data-message');
              self.messageInput.value = message;
              self.sendMessage();
            }
          });
          document.addEventListener('click', function(e) {
            if (self.isOpen && !self.chatIcon.contains(e.target) && !self.chatWindow.contains(e.target)) {
              self.closeChat();
            }
          });
        };
        ChatSystem.prototype.generateSessionId = function() {
          return Math.random().toString(36).substring(2) + Date.now().toString(36);
        };
        ChatSystem.prototype.toggleChat = function() {
          if (this.isOpen) {
            this.closeChat();
          } else {
            this.openChat();
          }
        };
        ChatSystem.prototype.openChat = function() {
          this.isOpen = true;
          this.chatWindow.classList.add('active');
          this.chatIcon.classList.add('active');
          this.hideNotificationBadge();
          this.messageInput.focus();
          this.scrollToBottom();
        };
        ChatSystem.prototype.closeChat = function() {
          this.isOpen = false;
          this.chatWindow.classList.remove('active');
          this.chatIcon.classList.remove('active');
        };
        ChatSystem.prototype.showNotificationBadge = function() {
          this.notificationBadge.style.display = 'flex';
        };
        ChatSystem.prototype.hideNotificationBadge = function() {
          this.notificationBadge.style.display = 'none';
        };
        ChatSystem.prototype.autoResizeTextarea = function() {
          this.messageInput.style.height = 'auto';
          this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 80) + 'px';
        };
        ChatSystem.prototype.sendMessage = function() {
          var message = this.messageInput.value.trim();
          if (!message) return;
          this.addMessageToUI(message, 'user');
          this.messageInput.value = '';
          this.autoResizeTextarea();
          this.sendButton.disabled = true;
          this.showTypingIndicator();
          var self = this;
          this.callAPI(message)
            .then(function(response) {
              self.hideTypingIndicator();
              self.loadConversationHistory(response.conversation_history);
            })
            .catch(function(error) {
              console.error('Chat API Error:', error);
              self.hideTypingIndicator();
              self.addErrorMessage('Sorry, I am having trouble connecting right now. Please try again later.');
            })
            .finally(function() {
              self.sendButton.disabled = false;
            });
        };
        ChatSystem.prototype.callAPI = function(message) {
          var self = this;
          return fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sub_id: this.subId,
              session_id: this.sessionId,
              agent_id: this.agentId,
              message: message
            })
          })
          .then(function(response) {
            if (!response.ok) {
              throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
          });
        };
        ChatSystem.prototype.loadConversationHistory = function(conversationHistory) {
          var welcomeMessage = this.chatMessages.querySelector('.welcome-message');
          if (welcomeMessage) {
            welcomeMessage.remove();
          }
          this.chatMessages.innerHTML = '';
          if (conversationHistory && conversationHistory.length > 0) {
            var self = this;
            for (var i = 0; i < conversationHistory.length; i++) {
              var message = conversationHistory[i];
              var role = message.role === 'assistant' ? 'bot' : 'user';
              this.addMessageToUI(message.content, role);
            }
          }
          this.scrollToBottom();
        };
        ChatSystem.prototype.addMessageToUI = function(text, sender) {
          var messageElement = document.createElement('div');
          messageElement.className = 'message ' + sender;
          var time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          var formattedText = this.formatMessage(text);
          var bubbleDiv = document.createElement('div');
          bubbleDiv.className = 'message-bubble';
          bubbleDiv.innerHTML = formattedText;
          var timeDiv = document.createElement('div');
          timeDiv.className = 'message-time';
          timeDiv.textContent = time;
          bubbleDiv.appendChild(timeDiv);
          messageElement.appendChild(bubbleDiv);
          this.chatMessages.appendChild(messageElement);
          this.scrollToBottom();
        };
        ChatSystem.prototype.formatMessage = function(text) {
          var formatted = text;
          formatted = formatted.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
          formatted = formatted.replace(/\\n/g, '<br>');
          formatted = formatted.replace(/^\\d+\\.\\s+/gm, '<br>$&');
          formatted = formatted.replace(/^\\s*-\\s+/gm, '<br>• ');
          return formatted;
        };
        ChatSystem.prototype.addErrorMessage = function(text) {
          var errorElement = document.createElement('div');
          errorElement.className = 'error-message';
          errorElement.textContent = text;
          this.chatMessages.appendChild(errorElement);
          this.scrollToBottom();
        };
        ChatSystem.prototype.showTypingIndicator = function() {
          this.typingIndicator.style.display = 'block';
          this.scrollToBottom();
        };
        ChatSystem.prototype.hideTypingIndicator = function() {
          this.typingIndicator.style.display = 'none';
        };
        ChatSystem.prototype.scrollToBottom = function() {
          var self = this;
          setTimeout(function() {
            self.chatMessages.scrollTop = self.chatMessages.scrollHeight;
          }, 100);
        };
        document.addEventListener('DOMContentLoaded', function() {
          new ChatSystem();
        });
      </script>
    </div>`;
  };

  // Handle copy widget code
  const handleCopyWidget = async () => {
    if (!hasContext) {
      setErrorMessages((prev) => ({
        ...prev,
        [agent.id]: 'Please set up context first before copying the widget code.',
      }));
      return;
    }
    try {
      const widgetCode = generateChatWidgetCode(agent);
      await navigator.clipboard.writeText(widgetCode);
      setIsCopySuccess(true);
      setSuccessMessages((prev) => ({
        ...prev,
        [agent.id]: 'Widget code copied to clipboard! You can now paste it into your website.',
      }));
      setTimeout(() => {
        setSuccessMessages((prev) => ({ ...prev, [agent.id]: '' }));
        setIsCopySuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error copying widget code:', err);
      setErrorMessages((prev) => ({
        ...prev,
        [agent.id]: 'Failed to copy widget code. Please try again.',
      }));
    }
  };

  // Handle test chat widget
  const handleTestChatWidget = () => {
    if (onShowChatWidget) {
      onShowChatWidget(agent);
    }
  };

  // Handle opening context drawer
  const handleOpenContextDrawer = () => {
    setIsContextDrawerOpen(true);
  };

  // Handle closing context drawer
  const handleCloseContextDrawer = () => {
    setIsContextDrawerOpen(false);
  };

  // Callback to update hasContext when context is saved
  const handleContextSaved = () => {
    setHasContext(true);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Agent Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">Configure and set up your AI agent</p>
              <div className="mt-2 flex items-center">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">{agent.name}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-6">Configuration Steps</h4>
              <div className="space-y-6">
                {/* Step 1: Context Setup with Test Button */}
                <StepCard
                  stepNumber={1}
                  title="Context Setup"
                  description="Set up your AI agent's knowledge base and response settings to ensure users receive accurate and relevant answers."
                  buttonText={hasContext ? 'Update Context' : 'Set Context'}
                  buttonAction={handleOpenContextDrawer}
                  isCompleted={hasContext}
                  buttonColor="blue"
                  secondaryButtonText="Test"
                  secondaryButtonAction={handleTestChatWidget}
                  isSecondaryDisabled={!hasContext}
                  secondaryButtonColor="teal"
                />
                {/* Step 2: Widget Integration */}
                <StepCard
                  stepNumber={2}
                  title="Widget Integration"
                  description="Simply copy the widget code and place it on your site, application, social media or smart documents so the AI agent can interact with your users."
                  buttonText={isCopySuccess ? 'Copied!' : 'Copy Widget Code'}
                  buttonAction={handleCopyWidget}
                  isCompleted={isCopySuccess}
                  isDisabled={!hasContext}
                  buttonColor={isCopySuccess ? 'green' : 'purple'}
                >
                  {hasContext && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>Instructions:</strong> Please add the widget by inserting this code into the header section of your website.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </StepCard>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Context Drawer */}
      <UserCreatedAgentContextDrawer
        isOpen={isContextDrawerOpen}
        onClose={handleCloseContextDrawer}
        agent={agent}
        onContextSaved={handleContextSaved}
      />
    </>
  );
};

export default ConfigurationDrawer;