import React from 'react';
import { MLIntelligenceSuite } from '../components/MLIntelligenceSuite';

export const IrrigationPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl pb-12 font-sans">
      <div className="pb-1">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          Irrigation & Water Deficit Calculator
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Calculate daily crop water demand (ETc), rainfall deduction, net water volume, and drip run times.
        </p>
      </div>

      <MLIntelligenceSuite
        initialTab="irrigation"
        allowedTabs={['irrigation']}
      />
    </div>
  );
};
export default IrrigationPage;
