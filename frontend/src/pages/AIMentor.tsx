import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Farm } from '../types/farm';
import { getFarmsApi } from '../services/api';
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
    <div className="space-y-4 max-w-4xl mx-auto pb-12 font-sans">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">AI Farming Mentor</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Ask questions about crop schedules, fertilizer, irrigation, and field diagnostics.
          </p>
        </div>

        {/* Farm Selector */}
        {farms.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Farm:</span>
            <select
              value={selectedFarmId}
              onChange={handleSelectFarm}
              className="bg-white border border-[#cfe2d5] text-neutral-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-forest-600 shadow-2xs"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.total_area_hectares ? `${f.total_area_hectares.toFixed(1)} ha` : 'No area'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Conversational Workspace */}
      <div className="bg-[#f8fbf9] border border-[#cfe2d5] rounded-2xl overflow-hidden shadow-soft">
        <AgentMentorChat
          farms={farms}
          selectedFarmId={selectedFarmId}
          customLat={customLat}
          customLng={customLng}
          customArea={customArea}
        />
      </div>
    </div>
  );
};
export default AIMentor;
