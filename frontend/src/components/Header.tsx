import React, { useState } from 'react';
import { TabType, HealthResponse } from '../types/health';
import { SystemHealthBadge } from './SystemHealthBadge';
import { AuthModal } from './AuthModal';
import { useAuth } from '../context/AuthContext';
import { ExternalLink, BookOpen, LogOut, LogIn, UserPlus, Menu } from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  responseTimeMs: number;
  onRefresh: () => void;
  onToggleMobileMenu?: () => void;
}

const TAB_TITLES: Record<TabType, { title: string; subtitle: string }> = {
  'dashboard': {
    title: 'Farmer Command Center',
    subtitle: 'Real-time farm overview, live weather, soil status, and priority actions',
  },
  'my-farms': {
    title: 'My Farms & Land Parcels',
    subtitle: 'Manage land holdings, boundary coordinates, sub-fields, and active crop cycles',
  },
  'smart-farm-map': {
    title: 'Smart Farm Map & GIS',
    subtitle: 'Interactive boundary drawing, geodesic area calculations, and PostGIS geometry',
  },
  'farm-analysis': {
    title: 'Farm Intelligence & Environmental Layers',
    subtitle: 'Comprehensive ISRIC soil, Open-Meteo weather, terrain slopes, and water resources',
  },
  'ai-mentor': {
    title: 'AI Agricultural Mentor',
    subtitle: 'Autonomous conversational assistant powered by LangGraph agricultural tools',
  },
  'crop-planning': {
    title: 'Crop Planning & Harvest Yield Forecasting',
    subtitle: 'Machine learning crop suitability recommendations and harvest tonnage estimation',
  },
  'irrigation': {
    title: 'Precision Irrigation Intelligence',
    subtitle: 'FAO-56 Penman-Monteith crop water evapotranspiration (ETc) and drip scheduler',
  },
  'fertilizer': {
    title: 'Fertilizer & Soil Nutrient Balancing',
    subtitle: 'Soil nutrient deficit calculations and commercial Urea/DAP/MOP application schedules',
  },
  'disease-detection': {
    title: 'Crop Foliar Disease Diagnostics',
    subtitle: 'Computer-vision leaf inspection, pathology classification, and treatment plans',
  },
  'settings': {
    title: 'Settings & System Diagnostics',
    subtitle: 'User preferences, backend services status, PostGIS verification, and API config',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  health,
  loading,
  error,
  responseTimeMs,
  onRefresh,
  onToggleMobileMenu,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const info = TAB_TITLES[currentTab] || { title: 'AgriNexus AI', subtitle: '' };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="h-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{info.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{info.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Swagger Docs Link */}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Swagger Docs</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
          </a>

          {/* Live System Health Badge */}
          <div className="hidden sm:block">
            <SystemHealthBadge
              health={health}
              loading={loading}
              error={error}
              responseTimeMs={responseTimeMs}
              onRefresh={onRefresh}
            />
          </div>

          {/* User Auth Section */}
          <div className="pl-2 border-l border-slate-800 flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-white leading-none">
                    {user.full_name || user.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};
