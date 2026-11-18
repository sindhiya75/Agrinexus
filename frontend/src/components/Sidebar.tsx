import React from 'react';
import { TabType } from '../types/health';
import { 
  LayoutDashboard, 
  Tractor, 
  Map, 
  Bot, 
  Settings, 
  Sprout,
  Droplets,
  FlaskConical,
  ShieldAlert,
  Activity,
  Calendar,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  mobileOpen = false, 
  onCloseMobile 
}) => {
  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-farms', label: 'My Farms', icon: Tractor },
    { id: 'smart-farm-map', label: 'Smart Farm Map', icon: Map },
    { id: 'farm-analysis', label: 'Farm Analysis', icon: Activity },
    { id: 'ai-mentor', label: 'AI Mentor', icon: Bot },
  ];

  const agronomyItems: NavItem[] = [
    { id: 'crop-planning', label: 'Crop Planning', icon: Sprout },
    { id: 'smart-farming-calendar', label: 'Farming Calendar', icon: Calendar },
    { id: 'irrigation', label: 'Irrigation', icon: Droplets },
    { id: 'fertilizer', label: 'Fertilizer', icon: FlaskConical },
    { id: 'disease-detection', label: 'Disease Detection', icon: ShieldAlert },
  ];

  const handleNavClick = (tab: TabType) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <p className="px-3 text-[11px] font-semibold text-forest-300/60 uppercase tracking-wider mb-1.5">
        {title}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isActive
                ? 'bg-forest-700 text-white font-semibold shadow-sm'
                : 'text-cream-200/80 hover:text-white hover:bg-forest-800/60'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-forest-300/80'}`} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-[#153e2d] text-cream-100 border-r border-[#1d4e39]">
      <div className="overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-forest-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-200">
              <Sprout className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                AgriNexus <span className="text-[10px] text-emerald-300 font-mono px-1 py-0.2 rounded bg-forest-900 border border-forest-700">AI</span>
              </span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-cream-300 hover:text-white hover:bg-forest-800"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="p-3 space-y-5">
          {renderNavGroup('Management', mainNavItems)}
          {renderNavGroup('Agronomy Tools', agronomyItems)}
        </div>
      </div>

      {/* Settings / Footer */}
      <div className="p-3 border-t border-forest-800/60">
        <button
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            currentTab === 'settings'
              ? 'bg-forest-700 text-white font-semibold'
              : 'text-cream-200/80 hover:text-white hover:bg-forest-800/60'
          }`}
        >
          <Settings className={`w-4 h-4 shrink-0 ${currentTab === 'settings' ? 'text-emerald-300' : 'text-forest-300/80'}`} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] shadow-2xl z-50 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
export default Sidebar;
