import React from 'react';
import { MLIntelligenceSuite } from '../components/MLIntelligenceSuite';
import { Sprout, ShieldCheck } from 'lucide-react';

export const CropPlanning: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl pb-16 animate-fadeIn">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Sprout className="w-3.5 h-3.5" />
            Machine Learning • Multi-Crop Suitability & Yield Regression
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Crop Planning & Harvest Yield Forecasting
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Simulate and identify optimal crop selections based on your field's soil chemistry, microclimate, and precipitation. Model harvest yields with 90% statistical confidence intervals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            RandomForest CV: 98.4%
          </span>
        </div>
      </div>

      {/* Embedded Suite restricted to Crop and Yield */}
      <MLIntelligenceSuite
        initialTab="crop"
        allowedTabs={['crop', 'yield']}
        title="Crop Selection & Harvest Projection Studio"
        subtitle="Ranked crop suitability with physiological threshold breakdown, alongside harvest tonnage estimation."
        badge="ML Agronomic Models"
      />
    </div>
  );
};
