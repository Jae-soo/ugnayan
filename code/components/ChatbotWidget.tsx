'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  linkTargetTab?: string
  linkLabel?: string
}

interface QuickAction {
  label: string
  message: string
}

interface ChatbotWidgetProps {
  onNavigate?: (tabId: string) => void
}

export default function ChatbotWidget({ onNavigate }: ChatbotWidgetProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Ugnayan assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState<string>('')
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const nextMessageIdRef = useRef(2)

  const quickActions: QuickAction[] = [
    { label: '📄 Request Document', message: 'I want to request a document' },
    { label: '🚨 Report Issue', message: 'I need to report an issue' },
    { label: '📍 View Map', message: 'Show me the community map' },
    { label: '📞 Contact Info', message: 'What are your contact details?' }
  ]

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
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

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! Welcome to Ugnayan. I can help you with service requests, reporting issues, or answering questions about Barangay Irisan.'
    }
    
    if (lowerMessage.includes('clearance') || lowerMessage.includes('certificate') || lowerMessage.includes('document')) {
      return 'To request a barangay clearance or certificate, please go to the Services tab and fill out the document request form. You\'ll receive a reference ID to track your request.'
    }
    
    if (lowerMessage.includes('complaint') || lowerMessage.includes('report') || lowerMessage.includes('issue')) {
      return 'You can report issues or complaints through the Services tab under "Report Issues". We handle emergencies, landslides, flooding, and general complaints.'
    }
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('help')) {
      return 'For emergencies, please go to the Emergency tab for hotline numbers. For fire: 911, Medical emergencies: (074) 442-2422, or Barangay Hotline: (074) 123-4567'
    }
    
    if (lowerMessage.includes('map') || lowerMessage.includes('location')) {
      return 'Check out the Map tab to view transportation hubs and hazard zones in Barangay Irisan.'
    }
    
    if (lowerMessage.includes('hours') || lowerMessage.includes('time') || lowerMessage.includes('open')) {
      return 'Our office hours are: Monday-Friday: 8:00 AM - 5:00 PM. Closed on weekends and holidays. Our office is located at Purok 18, Barangay Irisan, Baguio City.'
    }
    
    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      return 'You can reach us at:\n📞 Phone: (074) 123-4567\n📧 Email: irisan.baguio@gmail.com\n📍 Address: Purok 18, Barangay Irisan, Baguio City'
    }
    
    if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
      return 'You can track your requests in the "My Requests" tab. Just enter your email address to view all your submissions and their current status.'
    }
    
    if (lowerMessage.includes('announcement') || lowerMessage.includes('news')) {
      return 'Check the Announcements tab to stay updated with community news, events, and important alerts from Barangay Irisan.'
    }
    
    if (lowerMessage.includes('feedback')) {
      return 'We value your feedback! Go to the Feedback tab to rate our services and leave comments. Your input helps us improve.'
    }

    if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with today?'
    }

    // Default response for unrelated or random questions
    return `I might not be able to help with "${userMessage}".\n\nI'm mainly focused on Barangay Irisan services, like:\n\n• 📄 Document requests (clearances, certificates, permits)\n• 🚨 Reporting issues or emergencies\n• 🕐 Office hours and contact information\n• 📊 Tracking your requests\n• 📢 Community announcements\n• 🗺️ Using the map feature\n\nPlease try asking something related to these services so I can assist you better.`
  }

  const getLinkTarget = (userMessage: string): { tab: string; label: string } | null => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('clearance') || lowerMessage.includes('certificate') || lowerMessage.includes('document')) {
      return { tab: 'services', label: 'Open Document Requests form' }
    }

    if (lowerMessage.includes('complaint') || lowerMessage.includes('report') || lowerMessage.includes('issue')) {
      return { tab: 'services', label: 'Open Report Issues form' }
    }

    if (lowerMessage.includes('emergency') || lowerMessage.includes('help')) {
      return { tab: 'emergency', label: 'Open Emergency Contacts' }
    }

    if (lowerMessage.includes('map') || lowerMessage.includes('location')) {
      return { tab: 'map', label: 'Open Community Map' }
    }

    if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
      return { tab: 'myrequests', label: 'Open My Requests' }
    }

    if (lowerMessage.includes('announcement') || lowerMessage.includes('news')) {
      return { tab: 'announcements', label: 'Open Announcements' }
    }

    if (lowerMessage.includes('feedback') || lowerMessage.includes('review') || lowerMessage.includes('rating')) {
      return { tab: 'feedback', label: 'Open Feedback form' }
    }

    if (
      lowerMessage.includes('contact') ||
      lowerMessage.includes('phone') ||
      lowerMessage.includes('email') ||
      lowerMessage.includes('hour') ||
      lowerMessage.includes('time') ||
      lowerMessage.includes('open')
    ) {
      return { tab: 'home', label: 'Go to Home information' }
    }

    return null
  }

  const getNextMessageId = (): string => {
    const currentId = nextMessageIdRef.current.toString()
    nextMessageIdRef.current += 1
    return currentId
  }

  const handleSendMessage = (text?: string): void => {
    const messageText = text || inputValue
    if (!messageText.trim()) return

    // Add user message
    const userMessage: Message = {
      id: getNextMessageId(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages((prev: Message[]) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    const linkTarget = getLinkTarget(messageText)

    setTimeout(() => {
      const botResponse: Message = {
        id: getNextMessageId(),
        text: getBotResponse(messageText),
        sender: 'bot',
        timestamp: new Date(),
        linkTargetTab: linkTarget ? linkTarget.tab : undefined,
        linkLabel: linkTarget ? linkTarget.label : undefined
      }
      setMessages((prev: Message[]) => [...prev, botResponse])
      setIsTyping(false)
    }, 1000)
  }

  const handleQuickAction = (action: QuickAction): void => {
    handleSendMessage(action.message)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 z-[9999] flex items-center justify-center transition-all duration-300 hover:scale-110 group border-2 border-white"
          size="icon"
        >
          <MessageCircle className="h-7 w-7 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="h-3 w-3 text-white animate-pulse" />
          </span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div ref={chatWindowRef} className="fixed bottom-6 right-6 z-[10000] animate-in slide-in-from-bottom-5 duration-300">
          <Card className="w-[400px] h-[600px] shadow-2xl flex flex-col overflow-hidden border-2 border-green-200">
            {/* Header - Fixed at top */}
            <CardHeader className="flex-shrink-0 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white p-5 border-b-4 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full shadow-lg relative">
                    <Bot className="h-6 w-6 text-green-600" />
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Ugnayan Assistant</h3>
                    <p className="text-xs text-green-100 flex items-center gap-1">
                      <span className="h-2 w-2 bg-green-300 rounded-full animate-pulse" />
                      Always here to help
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-9 w-9 rounded-full transition-all hover:rotate-90 duration-300"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col bg-gradient-to-b from-gray-50 to-white overflow-hidden">
              {/* Messages Area - Scrollable */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender === 'bot' && (
                        <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-full h-9 w-9 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Bot className="h-5 w-5 text-green-700" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        {message.sender === 'bot' && message.linkTargetTab && onNavigate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate(message.linkTargetTab as string)}
                            className="mt-2 text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-50"
                          >
                            {message.linkLabel || 'Open this section'}
                          </Button>
                        )}
                        <p
                          className={`text-xs mt-1.5 ${
                            message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {message.sender === 'user' && (
                        <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-full h-9 w-9 flex items-center justify-center flex-shrink-0 shadow-md">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-2 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-full h-9 w-9 flex items-center justify-center shadow-sm">
                        <Bot className="h-5 w-5 text-green-700" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Quick Actions - Fixed below messages, not scrolling */}
              {!isTyping && (
                <div className="flex-shrink-0 p-4 pt-2 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center font-medium mb-2">Quick actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action: QuickAction, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action)}
                        className="text-xs h-auto py-2 px-3 border-2 border-green-200 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:border-green-400 transition-all duration-200 hover:shadow-md bg-white shadow-sm"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area - Fixed at bottom */}
              <div className="flex-shrink-0 p-4 border-t-2 border-gray-100 bg-white">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border-2 border-gray-200 focus:border-green-400 rounded-xl px-4 h-11 shadow-sm"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl shadow-md h-11 w-11 transition-all hover:scale-105"
                    size="icon"
                    disabled={!inputValue.trim()}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">Powered by Ugnayan AI</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
