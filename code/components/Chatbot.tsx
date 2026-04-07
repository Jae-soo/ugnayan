'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles, User, Bot } from 'lucide-react'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm Ugnayan Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState<string>('')
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('document') || lowerMessage.includes('request') || lowerMessage.includes('clearance') || lowerMessage.includes('certificate')) {
      return "To request documents like Barangay Clearance, Certificates, or Permits:\n\n1. Go to the 'Service Request' tab\n2. Fill out the form with your details\n3. Select the document type you need\n4. Submit and you'll receive a reference ID\n\nYou can track your request status in the 'My Requests' tab using your email address. Processing usually takes 3-5 business days."
    }

    if (lowerMessage.includes('complaint') || lowerMessage.includes('report') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      return "To file a report or complaint:\n\n1. Visit the 'Report & Emergency' tab\n2. Choose your report type (Emergency, Landslide, Flooding, Streetlight, Infrastructure)\n3. Provide detailed information and location\n4. Select priority level if urgent\n5. Submit with your contact details\n\nFor life-threatening emergencies, please call our hotline: (074) 442-7728 immediately!"
    }

    if (lowerMessage.includes('hour') || lowerMessage.includes('time') || lowerMessage.includes('open') || lowerMessage.includes('schedule')) {
      return "📅 Barangay Irisan Office Hours:\n\nMonday - Friday: 8:00 AM - 5:00 PM\nWeekends & Holidays: Closed\n\n📍 Location:\nPurok 18, Barangay Irisan, Baguio City\n\n📞 Contact Us:\nPhone: (074) 442-7728\nEmail: barangay.irisan@baguio.gov.ph"
    }

    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('help')) {
      return "🚨 Emergency Contacts:\n\n• Barangay Emergency: (074) 442-7728\n• Fire Department: (074) 442-2222\n• Police Station: (074) 442-2333\n• Medical Emergency: (074) 442-4444\n• CDRRMO Baguio: (074) 442-5555\n\nFor immediate life-threatening emergencies, call 911 or contact the numbers above directly. You can also submit an emergency report through our 'Report & Emergency' tab with HIGH priority."
    }

    if (lowerMessage.includes('map') || lowerMessage.includes('location') || lowerMessage.includes('transportation') || lowerMessage.includes('business')) {
      return "🗺️ Our Community Map features:\n\n• Public Transportation (jeepney terminals, tricycle stations, bus stops)\n• Streetlight Locations & Status\n• Hazard Zones (landslide areas, flood zones)\n• Local Businesses & Services\n\nGo to the 'Map' tab to explore interactive markers. Click on any marker to see detailed information about that location. The map helps you navigate Barangay Irisan and stay informed about community resources!"
    }

    if (lowerMessage.includes('track') || lowerMessage.includes('status') || lowerMessage.includes('reference')) {
      return "To track your requests:\n\n1. Go to the 'My Requests' tab\n2. Enter the email address you used when submitting\n3. Click 'Search My Requests'\n4. View all your submissions with their current status\n\nEach request has a unique Reference ID. Status updates include:\n• Pending - Under review\n• In Progress - Being processed\n• Ready - Available for pickup\n• Completed/Resolved - Finished"
    }

    if (lowerMessage.includes('announcement') || lowerMessage.includes('news') || lowerMessage.includes('update')) {
      return "📢 Stay updated with community announcements!\n\nVisit the 'Announcements' tab to see:\n• Community events and activities\n• Important notices and alerts\n• Barangay programs and initiatives\n• Safety advisories\n• Weather updates\n\nWe regularly post updates to keep residents informed about what's happening in Barangay Irisan."
    }

    if (lowerMessage.includes('feedback') || lowerMessage.includes('review') || lowerMessage.includes('rating')) {
      return "We value your feedback! 💚\n\nThe 'Feedback' tab allows you to:\n• Rate barangay services (1-5 stars)\n• Share your experience\n• Provide suggestions for improvement\n• Help us serve you better\n\nYour honest feedback promotes transparency and accountability in our community services."
    }

    // Default response for unrelated or random questions
    return `I might not be able to help with "${userMessage}".\n\nI'm designed mainly for Barangay Irisan services, like:\n\n• 📄 Document requests (clearances, certificates, permits)\n• 🚨 Reporting issues or emergencies\n• 🕐 Office hours and contact information\n• 📊 Tracking your requests\n• 📢 Community announcements\n• 🗺️ Using the map feature\n• 💬 Providing feedback\n\nPlease try asking something related to these services so I can assist you better.`
  }

  const handleSend = async () => {
    if (inputValue.trim() === '') return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    const botResponse: Message = {
      id: messages.length + 2,
      text: getBotResponse(inputValue),
      sender: 'bot',
      timestamp: new Date()
    }

    setIsTyping(false)
    setMessages(prev => [...prev, botResponse])
  }

  const handleQuickAction = async (action: string) => {
    const userMessage: Message = {
      id: messages.length + 1,
      text: action,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    await new Promise(resolve => setTimeout(resolve, 800))

    const botResponse: Message = {
      id: messages.length + 2,
      text: getBotResponse(action),
      sender: 'bot',
      timestamp: new Date()
    }

    setIsTyping(false)
    setMessages(prev => [...prev, botResponse])
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/50 hover:from-green-600 hover:to-green-700 transition-all duration-300 z-[9999] group"
          aria-label="Open chat"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <span className="absolute -top-2 -right-2 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl z-[10000] animate-in slide-in-from-bottom-5 duration-300 flex flex-col"
          style={{ height: '600px', maxHeight: 'calc(100vh - 3rem)' }}
        >
          {/* Header - Fixed at top */}
          <div className="flex-shrink-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="absolute bottom-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 border-2 border-white"></span>
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Ugnayan Assistant</h3>
                <p className="text-xs text-green-100">Online • Ready to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:rotate-90"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Container - Scrollable ONLY for messages */}
          <div 
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gradient-to-b from-green-50/30 to-white"
            style={{ minHeight: 0 }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-300 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={`flex-1 max-w-[75%] ${
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  } flex flex-col gap-1`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 shadow-md ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  </div>
                  <span className="text-xs text-gray-400 px-2">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Buttons - Fixed section, ALWAYS visible after first exchange */}
          {messages.length > 1 && (
            <div className="flex-shrink-0 px-4 py-3 border-t bg-gray-50">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickAction('How do I request a document?')}
                  className="text-xs bg-white border-2 border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  📄 Request Document
                </button>
                <button
                  onClick={() => handleQuickAction('How do I report an issue?')}
                  className="text-xs bg-white border-2 border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  🚨 Report Issue
                </button>
                <button
                  onClick={() => handleQuickAction('Show me the map')}
                  className="text-xs bg-white border-2 border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  🗺️ View Map
                </button>
                <button
                  onClick={() => handleQuickAction('What are your office hours?')}
                  className="text-xs bg-white border-2 border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:shadow-md transition-all duration-200 font-medium"
                >
                  📞 Contact Info
                </button>
              </div>
            </div>
          )}

          {/* Input Area - Fixed at bottom, ALWAYS visible */}
          <div className="flex-shrink-0 p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSend}
                disabled={inputValue.trim() === ''}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2 rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/50 flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Powered by Ugnayan AI • Press Enter to send
            </p>
          </div>
        </div>
      )}
    </>
  )
}
