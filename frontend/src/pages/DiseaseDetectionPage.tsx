import React from 'react';
import { MLIntelligenceSuite } from '../components/MLIntelligenceSuite';

export const DiseaseDetectionPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-7xl pb-12 font-sans">
      <div className="pb-1">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          Crop Disease Detection
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Upload plant leaf photographs to identify symptoms and review curative treatments.
        </p>
      </div>

      <MLIntelligenceSuite
        initialTab="disease"
        allowedTabs={['disease']}
      />
    </div>
  );
};
export default DiseaseDetectionPage;
