import React from 'react';
import { MLIntelligenceSuite } from '../components/MLIntelligenceSuite';
export const FertilizerPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl pb-12 font-sans">
      <div className="pb-1">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          Fertilizer & Nutrient Advisor
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Compute elemental nutrient deficits and calculate commercial Urea, DAP, and MOP dosages.
        </p>
      </div>

      <MLIntelligenceSuite
        initialTab="fertilizer"
        allowedTabs={['fertilizer']}
      />
    </div>
  );
};
export default FertilizerPage;
