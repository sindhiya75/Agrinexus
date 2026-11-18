import React from 'react';
import { MLIntelligenceSuite } from '../components/MLIntelligenceSuite';

export const CropPlanning: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl pb-12 font-sans">
      <div className="pb-1">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          Crop Planning & Yield Forecasting
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Evaluate crop suitability for soil and climate parameters, and forecast expected harvest yields.
        </p>
      </div>

      <MLIntelligenceSuite
        initialTab="crop"
        allowedTabs={['crop', 'yield']}
      />
    </div>
  );
};
export default CropPlanning;
