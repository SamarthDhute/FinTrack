import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Check,
  Mic,
  MicOff,
  Zap,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Target
} from 'lucide-react';
import { api } from '../api/client';

export const AIChatDrawer = ({ externalOpen, onExternalClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [providerInfo, setProviderInfo] = useState(null);

  // Sync external open state
  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== null) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onExternalClose) onExternalClose();
  };

  const initialWelcomeMessage = {
    role: 'assistant',
    content: '👋 Namaste! I am your **FinTrack AI Financial Advisor**.\n\nAsk me anything in **English, Hindi, or Hinglish** about your spending, highest expenses, active budgets, or savings tips!',
    quick_followups: [
      'Is mahine maine sabse zyada kahan kharch kiya?',
      'Kya mera koi budget cross hua hai?',
      'Food pe kitna kharcha hua?',
      'How can I save ₹5,000 this month?',
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState([initialWelcomeMessage]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto-focus input when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Global Keyboard shortcuts: Ctrl+K / Cmd+K to toggle, Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fetch AI provider status on mount
  useEffect(() => {
    let isMounted = true;
    api.ai.getProviderStatus()
      .then((res) => {
        if (isMounted && res) {
          setProviderInfo(res);
        }
      })
      .catch(() => {
        // Fallback silently if unauthenticated or offline
      });
    return () => { isMounted = false; };
  }, []);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: text, timestamp: timeString };
    
    // Create new message array with user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build history excluding initial greeting
      const historyPayload = messages
        .filter((_, idx) => idx > 0)
        .slice(-4)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.ai.chat({
        message: text,
        history: historyPayload,
      });

      const assistantMsg = {
        role: 'assistant',
        content: res?.reply || 'I analyzed your spending records.',
        quick_followups: res?.quick_followups || [],
        provider_used: res?.provider_used || 'AI Engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = {
        role: 'assistant',
        content: `⚠️ **Connection Notice:** Could not reach the financial intelligence engine (${err.message || 'Network error'}).\n\nPlease ensure your backend is running at \`http://localhost:8000\`.`,
        quick_followups: ['Try asking again', 'Where did I spend the most?'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        ...initialWelcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopyText = (content, index) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Speech Recognition (Voice Input)
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Works great for Indian English / Hinglish
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Markdown Formatter helper for text bubbles
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, lIdx) => {
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        return <div key={lIdx} style={{ height: '6px' }} />;
      }

      // Bullet points (• or - or *)
      if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
        return (
          <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '3px 0' }}>
            <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.9rem' }}>•</span>
            <div>{renderInlineTokens(bulletText)}</div>
          </div>
        );
      }

      // Numbered lists (1. or 2.)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '4px 0' }}>
            <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.8rem', minWidth: '16px' }}>{numMatch[1]}.</span>
            <div>{renderInlineTokens(numMatch[2])}</div>
          </div>
        );
      }

      // Normal paragraph
      return (
        <p key={lIdx} style={{ margin: lIdx > 0 ? '4px 0 0 0' : 0 }}>
          {renderInlineTokens(trimmed)}
        </p>
      );
    });
  };

  // Parses **bold** and `code` inside lines
  const renderInlineTokens = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} style={{ color: 'inherit', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={pIdx}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '0.8em',
              fontFamily: 'monospace',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Action Trigger Button (Bottom-Right) */}
      <button
        className="ai-chat-floating-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 998,
          background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.92rem',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
        }}
        title="Open AI Financial Chat Assistant (Ctrl + K)"
      >
        <Sparkles size={19} className="animate-pulse" />
        <span>Ask FinTrack AI</span>
        <span
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            padding: '2px 7px',
            borderRadius: '10px',
            fontSize: '0.7rem',
            marginLeft: '2px',
            letterSpacing: '0.5px',
          }}
        >
          Ctrl+K
        </span>
      </button>

      {/* Slide-over Chat Modal Drawer */}
      {isOpen && (
        <div
          className="ai-chat-drawer-container"
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: isExpanded ? '540px' : '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: isExpanded ? '640px' : '530px',
            maxHeight: 'calc(100vh - 120px)',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                }}
              >
                <Bot size={19} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>FinTrack AI Advisor</span>
                  <span
                    style={{
                      background: 'rgba(22, 163, 74, 0.1)',
                      color: '#16A34A',
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      fontWeight: 700,
                    }}
                  >
                    Active
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                  <span>{providerInfo?.active_engine || 'Smart Multi-Model Engine'}</span>
                </div>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Reset / Clear Chat */}
              <button
                onClick={handleClearChat}
                title="Clear Conversation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}
              >
                <RotateCcw size={15} />
              </button>

              {/* Expand / Minimize Toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Compact View' : 'Expand View'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              {/* Close Drawer */}
              <button
                onClick={handleClose}
                title="Close (Esc)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#FFFFFF',
            }}
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: isExpanded ? '85%' : '90%',
                      padding: '11px 15px',
                      borderRadius: isUser ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                      background: isUser
                        ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                        : '#F3F4F6',
                      color: isUser ? '#ffffff' : '#111827',
                      fontSize: '0.86rem',
                      lineHeight: 1.55,
                      border: isUser ? 'none' : '1px solid #E5E7EB',
                      boxShadow: isUser
                        ? '0 2px 8px rgba(59, 130, 246, 0.25)'
                        : '0 1px 3px rgba(0, 0, 0, 0.04)',
                      wordBreak: 'break-word',
                      position: 'relative',
                    }}
                  >
                    {renderFormattedContent(msg.content)}

                    {/* Bottom Metadata & Copy Button */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        paddingTop: '4px',
                        borderTop: isUser ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #E5E7EB',
                        fontSize: '0.68rem',
                        color: isUser ? 'rgba(255, 255, 255, 0.8)' : '#6B7280',
                      }}
                    >
                      <span>{msg.timestamp || ''}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopyText(msg.content, index)}
                          title="Copy Answer"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedIndex === index ? '#16A34A' : '#6B7280',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.68rem',
                          }}
                        >
                          {copiedIndex === index ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Interactive Quick Follow-up Chips */}
                  {msg.quick_followups && msg.quick_followups.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '8px',
                        maxWidth: isExpanded ? '85%' : '90%',
                      }}
                    >
                      {msg.quick_followups.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSendMessage(chip)}
                          disabled={isLoading}
                          style={{
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            color: '#3B82F6',
                            borderRadius: '12px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                            e.currentTarget.style.borderColor = '#3B82F6';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F9FAFB';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <span>{chip}</span>
                          <ChevronRight size={12} style={{ color: '#3B82F6', flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Loading Indicator */}
            {isLoading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#3B82F6',
                  fontSize: '0.82rem',
                  padding: '8px 12px',
                  background: '#F3F4F6',
                  borderRadius: '12px',
                  width: 'fit-content',
                  border: '1px solid #E5E7EB',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <Loader2 size={15} className="animate-spin" />
                <span>AI analyzing your financial data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar Footer */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #E5E7EB',
              background: '#FFFFFF',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                title={isListening ? 'Listening... click to stop' : 'Voice Input (Hinglish/English)'}
                style={{
                  background: isListening ? '#DC2626' : '#F3F4F6',
                  border: isListening ? '1px solid #DC2626' : '1px solid #E5E7EB',
                  color: isListening ? '#ffffff' : '#6B7280',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                placeholder={isListening ? 'Listening to your voice...' : 'Ask e.g. Food pe kitna spend kiya?...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#111827',
                  fontSize: '0.86rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.15)';
                  e.target.style.background = '#FFFFFF';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#F9FAFB';
                }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                title="Send Message (Enter)"
                style={{
                  background: inputMessage.trim()
                    ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
                    : '#E5E7EB',
                  color: inputMessage.trim() ? '#ffffff' : '#9CA3AF',
                  border: 'none',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputMessage.trim() ? 'pointer' : 'default',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: inputMessage.trim() ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatDrawer;
