import React, { useState } from 'react';
import { Sparkles, Send, Bot, Loader2, ChevronRight, CornerDownLeft } from 'lucide-react';
import { api } from '../api/client';

export const AIDashboardChatQuery = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const quickPrompts = [
    'Is mahine maine sabse zyada kahan kharch kiya?',
    'Food pe kitna kharcha hua?',
    'Kya mera koi budget cross hua hai?',
    'How can I save ₹5,000 this month?'
  ];

  const handleAsk = async (textToAsk = null) => {
    const text = (textToAsk || query).trim();
    if (!text || loading) return;

    try {
      setLoading(true);
      setResponse(null);
      const res = await api.ai.chat({
        message: text,
        history: [],
      });
      setResponse({
        query: text,
        reply: res.reply || 'I analyzed your spending records.',
        followups: res.quick_followups || [],
      });
      setQuery('');
    } catch (err) {
      console.error('AI chat query error:', err);
      setResponse({
        query: text,
        reply: err.message || 'Could not fetch insights. Please ensure backend is connected.',
        followups: ['Try asking again'],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="ai-dashboard-query-card"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '14px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 24px -6px rgba(99, 102, 241, 0.12)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <div 
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <Sparkles size={15} />
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
            Natural Language AI Financial Assistant
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '8px' }}>
            (Ask in Hindi, English, or Hinglish)
          </span>
        </div>
      </div>

      {/* Query Input Bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
        style={{ display: 'flex', gap: '0.6rem', position: 'relative' }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="e.g. Is mahine maine sabse zyada kahan kharch kiya?..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#f8fafc',
            fontSize: '0.88rem',
          }}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !query.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0 16px',
            borderRadius: '10px',
            flexShrink: 0,
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
          <span>{loading ? 'Analyzing...' : 'Ask AI'}</span>
        </button>
      </form>

      {/* Preset Quick Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.75rem' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAsk(p)}
            disabled={loading}
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.18)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
          >
            <span>{p}</span>
            <ChevronRight size={11} style={{ color: '#818cf8' }} />
          </button>
        ))}
      </div>

      {/* Real-Time AI Response Box */}
      {response && (
        <div 
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '12px',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Bot size={16} style={{ color: '#818cf8' }} />
            <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>
              AI Answer for: "{response.query}"
            </span>
          </div>

          <div style={{ fontSize: '0.875rem', color: '#f1f5f9', lineHeight: 1.55 }}>
            {response.reply.split('\n').map((line, lIdx) => (
              <p key={lIdx} style={{ margin: lIdx > 0 ? '6px 0 0 0' : 0 }}>
                {line.split('**').map((part, pIdx) => 
                  pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: '#6ee7b7' }}>{part}</strong> : part
                )}
              </p>
            ))}
          </div>

          {/* Follow-up Prompts */}
          {response.followups && response.followups.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {response.followups.map((f, fIdx) => (
                <button
                  key={fIdx}
                  type="button"
                  onClick={() => handleAsk(f)}
                  style={{
                    background: 'rgba(52, 211, 153, 0.1)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    color: '#6ee7b7',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
