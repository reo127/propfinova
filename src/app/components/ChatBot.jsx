'use client';

import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hi! I'm your PropFinova assistant. How can I help you find your perfect property today?",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const predefinedResponses = {
        'hello': "Hello! How can I assist you with your property search?",
        'hi': "Hi there! I'm here to help you find the perfect property.",
        'help': "I can help you with:\n• Property search and filtering\n• Booking property viewings\n• Understanding property details\n• Connecting with our agents\n• General real estate questions",
        'buy': "Looking to buy? I can help you find properties in your budget and preferred location. What's your ideal price range?",
        'rent': "Interested in renting? Let me know your preferred area and budget, and I'll help you find suitable rental properties.",
        'contact': "You can reach our team at:\n• Email: info@propfinova.com\n• Phone: +1 (555) 123-4567\n• Or use our 'List Property' feature to get in touch!",
        'location': "We have properties across multiple locations. Use our search filters to find properties in your preferred area.",
        'price': "Property prices vary by location and type. Use our search feature to filter by your budget range.",
        'agents': "Our experienced agents are here to help! You can find agent information in the 'Agents' section of our website.",
    };

    const getBotResponse = async (userMessage) => {
        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting bot response:', error);
            return {
                response: "Sorry, I'm having trouble processing your request right now. Please try again in a moment.",
                type: 'error'
            };
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Get bot response from API
        try {
            const responseData = await getBotResponse(inputValue);
            
            const botResponse = {
                id: Date.now() + 1,
                text: responseData.response,
                sender: 'bot',
                timestamp: new Date(),
                type: responseData.type,
                properties: responseData.properties || null
            };
            
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorResponse = {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble right now. Please try again.",
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorResponse]);
            setIsTyping(false);
        }
    };

    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 bg-surface rounded-lg shadow-2xl border border-gray-200 mb-2">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-primary text-btn-text rounded-t-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold">PropFinova Assistant</h3>
                                <p className="text-xs opacity-90">Online now</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-white/20 p-1 rounded"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`${message.sender === 'user' ? 'max-w-xs' : 'max-w-sm'} px-4 py-2 rounded-lg ${
                                        message.sender === 'user'
                                            ? 'bg-primary text-btn-text rounded-br-none'
                                            : 'bg-surface text-gray-800 rounded-bl-none shadow'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                                    
                                    {/* Property cards for property search results */}
                                    {message.properties && message.properties.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {message.properties.slice(0, 3).map((property) => (
                                                <div
                                                    key={property._id}
                                                    className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                                    onClick={() => window.open(`/property/${property._id}`, '_blank')}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {property.gallery && property.gallery[0] && (
                                                            <img
                                                                src={property.gallery[0]}
                                                                alt={property.title}
                                                                className="w-12 h-12 object-cover rounded"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-xs text-gray-900 truncate">
                                                                {property.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-600">
                                                                📍 {property.location}
                                                            </p>
                                                            <p className="text-xs font-medium text-primary">
                                                                {typeof property.price === 'string' ? 
                                                                    (property.price.includes('₹') ? property.price : `₹${property.price}`) : 
                                                                    `₹${(property.price / 100000).toFixed(0)} L`
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {property.bhk ? property.bhk.toUpperCase() : property.type} • {property.mode}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {message.properties.length > 3 && (
                                                <p className="text-xs text-gray-600 italic">
                                                    +{message.properties.length - 3} more properties...
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    <p className="text-xs opacity-70 mt-1">
                                        {formatTime(message.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-surface text-gray-800 rounded-lg rounded-bl-none shadow px-4 py-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t bg-surface rounded-b-lg">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 text-black px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                className="px-4 py-2 bg-primary text-btn-text rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-primary hover:bg-primary/90 text-btn-text p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                aria-label="Toggle chat"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default ChatBot;