import React, { useState } from 'react';
import {
  Bot,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Calculator,
  Compass,
  Tractor
} from 'lucide-react';
import { agentChatApi } from '../services/api';
import { AgentChatResponse, DataCitation } from '../types/agent';
import { Farm } from '../types/farm';

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
  farms,
  selectedFarmId,
  customLat,
  customLng,
  customArea,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'init-1',
      sender: 'agent',
      text: "👋 Hello! I am your **Autonomous AI Farming Mentor**. Ask me any question like: *'What should I do this week for my farm?'*, *'Which crops are suitable for my soil?'*, or *'How much fertilizer does my paddy need?'*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const samplePrompts = [
    'What should I do this week for my farm?',
    'Which crops are suitable to plant given my soil?',
    'How much urea and DAP fertilizer should I apply?',
    'Calculate my 7-day crop water and irrigation deficit',
    'What is the expected yield and harvest tonnage?',
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
      setExpandedTraceId(agentMsg.id);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: `⚠️ **Agent Error**: ${err?.message || 'Failed to communicate with agricultural reasoning agent.'}`,
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800">
          <Database className="w-3 h-3" /> Retrieved Data
        </span>
      );
    }
    if (c.data_type === 'Calculated Value') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
          <Calculator className="w-3 h-3" /> Calculated Value
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-400 border border-purple-800">
        <Cpu className="w-3 h-3" /> ML Prediction
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[750px] overflow-hidden shadow-2xl">
      {/* Agent Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Agent AI Farming Mentor</h3>
              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono">
                LangGraph Multi-Tool
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous agricultural reasoner connected to GIS, weather, pedology, and ML models.
            </p>
          </div>
        </div>

        {selectedFarmId && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Tractor className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[150px]">
              {farms.find((f) => f.id === selectedFarmId)?.name || 'Active Farm'}
            </span>
          </div>
        )}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isAgent = m.sender === 'agent';
          const hasTrace = isAgent && m.data;
          const isExpanded = expandedTraceId === m.id;

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isAgent
                    ? 'bg-slate-950 border border-slate-800 text-slate-200'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-medium'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[10px] mt-2 font-mono text-right ${
                    isAgent ? 'text-slate-500' : 'text-slate-800'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {/* Collapsible Execution Trace & Reasoning */}
              {hasTrace && m.data && (
                <div className="w-full max-w-[85%] mt-2">
                  <button
                    onClick={() => setExpandedTraceId(isExpanded ? null : m.id)}
                    className="flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 transition-colors py-1 px-2 rounded bg-purple-950/30 border border-purple-800/40"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Agent Tool Execution Trace ({m.data.tools_executed.length} tools executed)</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-3.5 rounded-xl bg-slate-950/80 border border-purple-900/40 space-y-3 text-xs">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">
                          Detected Intent: <span className="font-mono text-purple-300">{m.data.detected_intent}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {m.data.tools_executed.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]"
                            >
                              ⚙️ {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Reasoning Steps */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">Reasoning Pipeline:</span>
                        <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-300">
                          {m.data.reasoning_steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Evidence Citations */}
                      {m.data.data_citations && m.data.data_citations.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 block mb-1">Data & Evidence Sources:</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                            {m.data.data_citations.map((c, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[11px] text-white">{c.metric}</span>
                                  {getCitationBadge(c)}
                                </div>
                                <p className="text-[10px] text-slate-400">{c.details}</p>
                                <span className="text-[9px] text-slate-500 block font-mono">Source: {c.source}</span>
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
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-purple-400 text-xs w-fit">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Agent parsing query, selecting tools, and analyzing farm data...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 px-4 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-semibold text-slate-500 uppercase shrink-0">Prompts:</span>
        {samplePrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-3">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Ask your agricultural question (e.g. 'What should I do this week for my farm?')..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputPrompt.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
