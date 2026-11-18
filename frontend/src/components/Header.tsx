import React, { useState } from 'react';
import { TabType, HealthResponse } from '../types/health';
import { AuthModal } from './AuthModal';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn, Menu, User } from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  health?: HealthResponse | null;
  loading?: boolean;
  error?: string | null;
  responseTimeMs?: number;
  onRefresh?: () => void;
  onToggleMobileMenu?: () => void;
}

const TAB_TITLES: Record<TabType, string> = {
  'dashboard': 'Dashboard',
  'my-farms': 'My Farms',
  'smart-farm-map': 'Smart Farm Map',
  'farm-analysis': 'Farm Analysis',
  'ai-mentor': 'AI Mentor',
  'crop-planning': 'Crop Planning',
  'smart-farming-calendar': 'Smart Farming Calendar',
  'irrigation': 'Irrigation',
  'fertilizer': 'Fertilizer',
  'disease-detection': 'Disease Detection',
  'settings': 'Settings',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onToggleMobileMenu,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const pageTitle = TAB_TITLES[currentTab] || 'AgriNexus AI';

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="h-16 bg-[#f4f9f6]/95 backdrop-blur-md border-b border-[#cfe2d5] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-forest-50 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <h1 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User Auth Section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-medium text-xs border border-forest-200">
                  {user?.full_name ? user.full_name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden md:block text-xs font-medium text-neutral-800 max-w-[120px] truncate">
                  {user?.full_name || user?.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-forest-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-forest-50 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => handleOpenAuth('register')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-forest-700 hover:bg-forest-800 text-white shadow-xs transition-colors"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};
export default Header;
