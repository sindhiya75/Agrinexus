import React from 'react';
import { MLIntelligenceSuite } from '../components/MLIntelligenceSuite';
import { Droplets } from 'lucide-react';

export const IrrigationPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl pb-16 animate-fadeIn">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <Droplets className="w-3.5 h-3.5" />
            FAO-56 Penman-Monteith Evapotranspiration
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Precision Irrigation & Water Deficit Calculator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Model dynamic crop evapotranspiration (ETc = Kc &times; ET0), factor in weather forecasts and effective rainfall, and compute exact drip irrigation pump running hours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-cyan-400 flex items-center gap-1.5 bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-800">
            <Droplets className="w-4 h-4" />
            Hydrological Standard Engine
          </span>
        </div>
      </div>

      {/* Embedded Suite restricted to Irrigation */}
      <MLIntelligenceSuite
        initialTab="irrigation"
        allowedTabs={['irrigation']}
        title="Crop Water Balance & Drip Scheduling Engine"
        subtitle="Calculates daily crop water loss, deductions from 7-day rainfall, net deficit volume in cubic meters, and pump runtime."
        badge="FAO-56 Irrigation Engine"
      />
    </div>
  );
};
