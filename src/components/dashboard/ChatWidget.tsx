// src/components/chat/ChatWidget.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { BASE_URL_AI } from '@/libraries/constant';

interface ChatWidgetProps {
  subId: string;
  agentId: string;
  onClose?: () => void;
  autoOpen?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ApiResponse {
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  success: boolean;
  error?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  subId, 
  agentId, 
  onClose,
  autoOpen = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef(generateSessionId());
  
  const apiEndpoint = `${BASE_URL_AI}/api/chat`;

  // Generate session ID
  function generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Auto-open chat widget
  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = Math.min(messageInputRef.current.scrollHeight, 80) + 'px';
    }
  }, [currentMessage]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleChat = () => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setShowNotificationBadge(false);
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 300);
  };

  const closeChat = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const formatMessage = (text: string): string => {
    let formatted = text;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br>');
    formatted = formatted.replace(/^\d+\.\s+/gm, '<br>$&');
    formatted = formatted.replace(/^\s*-\s+/gm, '<br>• ');
    return formatted;
  };

  const callAPI = async (message: string): Promise<ApiResponse> => {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sub_id: subId,
        session_id: sessionId.current,
        agent_id: agentId,
        message: message
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const loadConversationHistory = (conversationHistory: ApiResponse['conversation_history']) => {
    if (conversationHistory && conversationHistory.length > 0) {
      const formattedMessages: Message[] = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date()
      }));
      setMessages(formattedMessages);
    }
  };

  const addErrorMessage = (text: string) => {
    const errorMessage: Message = {
      role: 'assistant',
      content: `<div class="error-message">${text}</div>`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMessage]);
  };

  const sendMessage = async () => {
    const message = currentMessage.trim();
    if (!message || isSending) return;

    // Add user message to UI
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsSending(true);
    setIsTyping(true);

    try {
      const response = await callAPI(message);
      setIsTyping(false);
      if (response.success) {
      loadConversationHistory(response.conversation_history);
      } else {
        addErrorMessage(response.error || 'An error occurred while processing your request.');
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      setIsTyping(false);
      addErrorMessage('Sorry, I am having trouble connecting right now. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans">
      {/* Floating Chat Icon */}
      <div
        onClick={toggleChat}
        className={`w-15 h-15 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl relative overflow-hidden ${
          isOpen ? 'transform rotate-180' : ''
        }`}
      >
        <svg 
          className="w-7 h-7 fill-white transition-transform duration-300"
          viewBox="0 0 24 24"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        
        {/* Notification Badge */}
        {showNotificationBadge && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
            1
          </div>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <>
          {/* Backdrop */}
          {/* <div 
            className="fixed inset-0 bg-transparent bg-opacity-20 z-40"
            onClick={handleClickOutside}
          /> */}
          
          {/* Chat Window */}
          <div className="absolute bottom-22 right-5 w-[350px] h-[530px] mr-5 mb-2 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 z-50 md:w-[350px] md:h-[530px] sm:w-[90vw] sm:h-[70vh] sm:right-[-20px] sm:bottom-16">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image 
                  src="/icon.png"
                  alt="Graaho Logo"
                  width={32}
                  height={32}
                  className="object-cover rounded-full bg-white/20 p-1"
                />
                <div>
                  <h4 className="text-base font-semibold m-0 leading-tight">
                    Graaho AI Agent
                  </h4>
                  <p className="text-xs opacity-90 m-0 leading-tight mt-1">
                    We&apos;re here to help
                  </p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="w-9 text-white  text-xl p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <div className="w-15 h-15 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                    💬
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    Welcome to Graaho AI Agent!
                  </h3>
                  <p className="text-sm leading-relaxed">
                    Hi there! How can I help you today? Feel free to ask me anything.
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex gap-2 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl relative ${
                        message.role === 'assistant'
                          ? 'bg-gray-200 text-gray-800 rounded-bl-md'
                          : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-md'
                      }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(message.content)
                        }}
                      />
                      <div
                        className={`text-xs opacity-70 mt-1 ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 p-4 bg-white rounded-lg">
                  <span className="text-sm text-gray-600">AI Agent is typing</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: '1.4s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-white p-5 border-t border-gray-200">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={messageInputRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 border-2 border-gray-200 rounded-full px-4 py-3 text-sm outline-none resize-none min-h-[20px] max-h-[80px] transition-colors focus:border-blue-500 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !currentMessage.trim()}
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 border-none rounded-full text-white cursor-pointer flex items-center justify-center transition-all hover:scale-110 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 768px) {
          .chat-window {
            width: 90vw !important;
            height: 70vh !important;
            right: 5vw !important;
            bottom: 90px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;