import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { MyFarms } from './pages/MyFarms';
import { SmartFarmMap } from './pages/SmartFarmMap';
import { FarmAnalysis } from './pages/FarmAnalysis';
import { AIMentor } from './pages/AIMentor';
import { CropPlanning } from './pages/CropPlanning';
import { IrrigationPage } from './pages/IrrigationPage';
import { FertilizerPage } from './pages/FertilizerPage';
import { DiseaseDetectionPage } from './pages/DiseaseDetectionPage';
import { Settings } from './pages/Settings';
import { TabType, HealthResponse } from './types/health';
import { fetchHealth } from './services/api';
import { AuthProvider } from './context/AuthContext';

function MainAppContent() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number>(0);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchHealth();
      setHealth(res.data);
      setError(res.error);
      setResponseTimeMs(res.responseTimeMs);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to backend service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Poll every 20 seconds
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar with Desktop & Mobile Support */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentTab={currentTab}
          health={health}
          loading={loading}
          error={error}
          responseTimeMs={responseTimeMs}
          onRefresh={checkHealth}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              health={health}
              loading={loading}
              error={error}
              responseTimeMs={responseTimeMs}
              onRefresh={checkHealth}
              onNavigate={setCurrentTab}
            />
          )}
          {currentTab === 'my-farms' && <MyFarms />}
          {currentTab === 'smart-farm-map' && <SmartFarmMap />}
          {currentTab === 'farm-analysis' && <FarmAnalysis />}
          {currentTab === 'ai-mentor' && <AIMentor />}
          {currentTab === 'crop-planning' && <CropPlanning />}
          {currentTab === 'irrigation' && <IrrigationPage />}
          {currentTab === 'fertilizer' && <FertilizerPage />}
          {currentTab === 'disease-detection' && <DiseaseDetectionPage />}
          {currentTab === 'settings' && <Settings health={health} />}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
