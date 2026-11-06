'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Copy, Check, Building2 } from 'lucide-react';

/**
 * Property Card Component - Displays individual property in chat
 */
function PropertyCard({ property, onScheduleVisit }) {
  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `₹${price}`;
  };

  const getFirstImage = () => {
    if (property.gallery && property.gallery.length > 0) {
      return property.gallery[0];
    }
    return '/placeholder-property.jpg';
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all bg-surface group">
      <div className="relative h-40 bg-gray-100">
        <img
          src={getFirstImage()}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/placeholder-property.jpg';
          }}
        />
        {property.bhk && (
          <span className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            {property.bhk}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-base text-gray-900 mb-1 line-clamp-1">
          {property.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
          📍 {property.location}
        </p>

        <div className="flex items-baseline justify-between mb-4">
          <p className="text-lg font-bold text-blue-600">
            {formatPrice(property.price)}
          </p>
          {property.squareFootage && (
            <p className="text-xs text-gray-500">
              {property.squareFootage} sqft
            </p>
          )}
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md"
                >
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                  +{property.amenities.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => onScheduleVisit(property)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Schedule Site Visit
        </button>
      </div>
    </div>
  );
}

/**
 * Message Component with Copy functionality
 */
function Message({ message, onScheduleVisit }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex gap-4 px-4 py-8 ${message.role === 'assistant' ? 'bg-surface' : 'bg-gray-50'}`}>
      <div className="flex-shrink-0">
        {message.role === 'assistant' ? (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">You</span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-hidden">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>

        {message.properties && message.properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {message.properties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onScheduleVisit={onScheduleVisit}
              />
            ))}
          </div>
        )}

        {message.role === 'assistant' && !message.isError && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main AI Chat Component
 */
export default function PropertyAIChat({ onScheduleVisit, className = '' }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI property assistant. Tell me what your customer is looking for, and I'll help you find the perfect properties.\n\nFor example, try:\n• 'Customer wants 3BHK near Whitefield under 2 Cr'\n• 'Family with kids, needs good schools, peaceful area'\n• 'Premium apartments in Indiranagar'",
      properties: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Handle sending message to AI
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);

    // Add user message to chat
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage, properties: [] }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Prepare conversation history (exclude properties from history to save tokens)
      const conversationHistory = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call AI API
      const response = await fetch('/api/ai/property-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationHistory.slice(-10) // Last 5 exchanges (10 messages)
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get AI response');
      }

      // Add AI response to chat
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.aiResponse,
          properties: data.properties || []
        }
      ]);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message. Please try again.');

      // Add error message to chat
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
          properties: [],
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key down
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Clear conversation
   */
  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! How can I help you find properties today?",
        properties: []
      }
    ]);
    setError(null);
  };

  /**
   * Default schedule visit handler
   */
  const handleScheduleVisit = (property) => {
    if (onScheduleVisit) {
      onScheduleVisit(property);
    } else {
      // Default behavior - could open a modal or navigate to property details
      alert(`Scheduling visit for: ${property.title}\nLocation: ${property.location}`);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-surface ${className}`}>
      {/* Header - ChatGPT style minimal header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-surface">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">AI Property Assistant</h2>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="Clear chat"
          >
            New chat
          </button>
        </div>
      </div>

      {/* Messages Container - ChatGPT style centered content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <Message
              key={index}
              message={message}
              onScheduleVisit={handleScheduleVisit}
            />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-4 px-4 py-8 bg-surface">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Searching properties...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="px-4 py-4">
              <div className="max-w-3xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - ChatGPT style fixed bottom input */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-surface">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about properties... (e.g., 'Customer wants 3BHK near Whitefield under 2 Cr')"
              className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 shadow-sm"
              rows="1"
              style={{ minHeight: '52px', maxHeight: '200px' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick suggestion chips */}
          {messages.length === 1 && !isLoading && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                '4BHK near Whitefield under 5Cr',
                'Family with kids, peaceful area',
                'Premium apartments in Indiranagar'
              ].map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputMessage(example)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          )}

          {/* Footer text */}
          <p className="text-xs text-center text-gray-500 mt-3">
            AI can make mistakes. Verify property details before scheduling visits.
          </p>
        </div>
      </div>
    </div>
  );
}
