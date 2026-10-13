import React from 'react';
import { MLIntelligenceSuite } from '../components/MLIntelligenceSuite';
import { ShieldAlert, Camera } from 'lucide-react';

export const DiseaseDetectionPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl pb-16 animate-fadeIn">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Computer Vision Pathology Diagnostics
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Crop Foliar Disease Diagnostics & Treatment
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Upload or snap photos of infected plant foliage. The vision model analyzes spectral foliar morphometry and color lesions to classify pathogens and provide organic remedies and chemical fungicides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-rose-300 flex items-center gap-1.5 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-800">
            <Camera className="w-4 h-4 text-rose-400" />
            PlantVillage Foliar Model
          </span>
        </div>
      </div>

      {/* Embedded Suite restricted to Disease Vision */}
      <MLIntelligenceSuite
        initialTab="disease"
        allowedTabs={['disease']}
        title="Foliar Pathology Scanner & Diagnostic Studio"
        subtitle="Accepts leaf photographs, detects foliar diseases, grades infection severity, and prescribes curative treatment protocols."
        badge="Computer Vision Diagnostic"
      />
    </div>
  );
};
