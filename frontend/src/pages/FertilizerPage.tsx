import React from 'react';
import { MLIntelligenceSuite } from '../components/MLIntelligenceSuite';
import { FlaskConical, ShieldCheck } from 'lucide-react';

export const FertilizerPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl pb-16 animate-fadeIn">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            ICAR Nutrient Deficit Standards
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Fertilizer & Soil Nutrient Balancing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Input soil test lab values or ISRIC SoilGrids data. Compute elemental nutrient deficits (&Delta;N, &Delta;P₂O₅, &Delta;K₂O) and convert into actionable commercial Urea, DAP, and MOP dosages with split-stage timings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-300 flex items-center gap-1.5 bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-800">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Nutrient Balancing Engine
          </span>
        </div>
      </div>

      {/* Embedded Suite restricted to Fertilizer */}
      <MLIntelligenceSuite
        initialTab="fertilizer"
        allowedTabs={['fertilizer']}
        title="Soil Nutrient Balancing & Fertilizer Formulator"
        subtitle="Calculates required chemical and organic amendments tailored to crop growth stage and soil chemical status."
        badge="Agronomic RDF Formula"
      />
    </div>
  );
};
