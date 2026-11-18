import React, { useState } from 'react';
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Calculator,
  Compass,
  Info
} from 'lucide-react';
import { agentChatApi } from '../services/api';
import { AgentChatResponse, DataCitation } from '../types/agent';
import { Farm } from '../types/farm';
import { useAuth } from '../context/AuthContext';
import { MarkdownContent } from './MarkdownContent';

interface AgentMentorChatProps {
  farms: Farm[];
  selectedFarmId: string;
  customLat: string;
  customLng: string;
  customArea: string;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  data?: AgentChatResponse;
}

export const AgentMentorChat: React.FC<AgentMentorChatProps> = ({
  selectedFarmId,
  customLat,
  customLng,
  customArea,
}) => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'init-1',
      sender: 'agent',
      text: "Hello! I can help answer agronomic questions tailored to your farm, including crop recommendations, fertilizer schedules, water deficits, and weather considerations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const samplePrompts = [
    'What farming tasks are priority this week?',
    'Which crops are best suited for my soil?',
    'Calculate my 7-day irrigation deficit',
    'How much fertilizer should I apply for rice?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || loading) return;

    const userMsg: MessageItem = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await agentChatApi({
        message: text,
        farm_id: selectedFarmId || undefined,
        latitude: customLat ? parseFloat(customLat) : undefined,
        longitude: customLng ? parseFloat(customLng) : undefined,
        area_hectares: customArea ? parseFloat(customArea) : 1.0,
      });

      const agentMsg: MessageItem = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: res,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      const isAuthError = err?.message?.toLowerCase().includes('authenticated');
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: isAuthError
          ? 'Authentication required: Please sign in or register to query your private saved farm holdings.'
          : `Error: ${err?.message || 'Failed to communicate with agricultural reasoning agent.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const getCitationBadge = (c: DataCitation) => {
    if (c.data_type === 'Retrieved Data') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-50 text-sky-800 border border-sky-200">
          <Database className="w-2.5 h-2.5 text-sky-600" /> Data
        </span>
      );
    }
    if (c.data_type === 'Calculated Value') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Calculator className="w-2.5 h-2.5 text-emerald-700" /> Calc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-800 border border-purple-200">
        <Cpu className="w-2.5 h-2.5 text-purple-600" /> Model
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[600px] font-sans">
      {/* Guest Mode Indicator */}
      {!isAuthenticated && (
        <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Guest Mode:</strong> Answering with general agro-climatic intelligence. <strong>Sign in</strong> using the button in the top navigation to link your registered farm parcels and boundaries.
          </span>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3">
        {messages.map((m) => {
          const isAgent = m.sender === 'agent';
          const hasTrace = isAgent && m.data && m.data.tools_executed.length > 0;
          const isExpanded = expandedTraceId === m.id;

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  isAgent
                    ? 'bg-white border border-[#cfe2d5] text-neutral-900 shadow-2xs'
                    : 'bg-forest-700 text-white font-medium'
                }`}
              >
                {isAgent ? (
                  <MarkdownContent content={m.text} />
                ) : (
                  <div className="whitespace-pre-wrap">{m.text}</div>
                )}
                <div
                  className={`text-[10px] mt-1.5 text-right font-mono ${
                    isAgent ? 'text-neutral-400' : 'text-forest-200'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {/* Collapsible Execution Trace */}
              {hasTrace && m.data && (
                <div className="w-full max-w-[85%] mt-1.5">
                  <button
                    onClick={() => setExpandedTraceId(isExpanded ? null : m.id)}
                    className="flex items-center gap-1 text-[11px] text-forest-800 hover:text-forest-950 font-medium transition-colors py-1 px-2.5 rounded-lg bg-[#eef5f0] border border-[#cfe2d5]"
                  >
                    <Compass className="w-3 h-3 text-forest-600" />
                    <span>Reasoning trace ({m.data.tools_executed.length} tools)</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-1.5 p-3 rounded-xl bg-[#f4f9f6] border border-[#cfe2d5] space-y-2 text-xs">
                      <div>
                        <span className="text-[11px] font-semibold text-neutral-700">Intent:</span>{' '}
                        <span className="font-mono text-neutral-900 text-[11px]">{m.data.detected_intent}</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {m.data.tools_executed.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-white border border-[#cfe2d5] text-forest-800 font-mono text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {m.data.data_citations && m.data.data_citations.length > 0 && (
                        <div className="pt-2 border-t border-[#cfe2d5] space-y-1">
                          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                            Citations
                          </span>
                          <div className="space-y-1">
                            {m.data.data_citations.map((c: DataCitation, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-white border border-[#cfe2d5]">
                                <span className="font-medium text-neutral-800 truncate mr-2">{c.source}</span>
                                {getCitationBadge(c)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-neutral-600 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Analyzing farm telemetry and formulating response...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 border-t border-[#cfe2d5] bg-[#f8fbf9] flex flex-wrap gap-1.5">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#e8f2eb] hover:bg-[#d8e9dc] text-forest-900 border border-[#cfe2d5] transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-[#cfe2d5] bg-[#f4f9f6]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask a question about your farm..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={loading}
            className="flex-1 bg-white border border-[#cfe2d5] text-xs text-neutral-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-forest-600 placeholder-neutral-400 shadow-2xs"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="p-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg transition-colors disabled:opacity-40 shadow-xs"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
export default AgentMentorChat;
