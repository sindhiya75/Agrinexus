import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Farm } from '../types/farm';
import { getFarmsApi } from '../services/api';
import { Bot, Sparkles, MapPin, ShieldCheck, Compass } from 'lucide-react';
import { AgentMentorChat } from '../components/AgentMentorChat';

export const AIMentor: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  const [customLat, setCustomLat] = useState<string>('11.0168');
  const [customLng, setCustomLng] = useState<string>('76.9558');
  const [customArea, setCustomArea] = useState<string>('2.5');

  useEffect(() => {
    if (isAuthenticated) {
      getFarmsApi()
        .then((data) => {
          setFarms(data);
          if (data.length > 0) {
            setSelectedFarmId(data[0].id);
            if (data[0].latitude && data[0].longitude) {
              setCustomLat(String(data[0].latitude));
              setCustomLng(String(data[0].longitude));
              setCustomArea(data[0].total_area_hectares ? String(data[0].total_area_hectares) : '2.5');
            }
          }
        })
        .catch((err) => console.error('Error fetching farms:', err));
    }
  }, [isAuthenticated]);

  const handleSelectFarm = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedFarmId(id);
    const f = farms.find((farm) => farm.id === id);
    if (f && f.latitude && f.longitude) {
      setCustomLat(String(f.latitude));
      setCustomLng(String(f.longitude));
      setCustomArea(f.total_area_hectares ? String(f.total_area_hectares) : '2.5');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-2">
            <Bot className="w-3.5 h-3.5" />
            Phase 5 — Autonomous Agricultural Agent
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Agricultural Mentor <Sparkles className="w-5 h-5 text-purple-400" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Ask conversational questions in natural language. The agent executes dynamic planning across GIS, soil, weather, FAO-56 irrigation, and ML prediction engines to provide grounded, citation-backed farm advisories.
          </p>
        </div>

        {/* Farm Selector */}
        {farms.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 p-1.5 rounded-xl">
            <MapPin className="w-4 h-4 text-purple-400 ml-1.5" />
            <select
              value={selectedFarmId}
              onChange={handleSelectFarm}
              className="bg-transparent text-white text-xs font-medium focus:outline-none pr-3"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-800">
                  {f.name} ({f.total_area_hectares?.toFixed(1) || '?'} ha)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Conversational Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <AgentMentorChat
          farms={farms}
          selectedFarmId={selectedFarmId}
          customLat={customLat}
          customLng={customLng}
          customArea={customArea}
        />
      </div>

      {/* Agent Guardrails & Capabilities Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block">Multi-Tenant Protected</span>
            <span>All tool calls strictly enforce user ownership checks on farm IDs.</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5">
          <Compass className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block">Verified Data Citations</span>
            <span>Retrieved data, calculated values, and ML predictions are clearly distinguished.</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block">12 Agricultural Tools</span>
            <span>Orchestrates PostGIS, SoilGrids, Open-Meteo, RDF nutrients, and CV diagnosis.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
