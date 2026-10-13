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
  Code2,
  X,
  Compass
} from 'lucide-react';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  mobileOpen = false, 
  onCloseMobile 
}) => {
  const sections: NavSection[] = [
    {
      title: 'Operations & GIS',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'my-farms',
          label: 'My Farms',
          icon: Tractor,
        },
        {
          id: 'smart-farm-map',
          label: 'Smart Farm Map',
          icon: Map,
          badge: 'GIS',
          badgeColor: 'bg-sky-950 text-sky-400 border-sky-800/50',
        },
        {
          id: 'farm-analysis',
          label: 'Farm Analysis',
          icon: Activity,
          badge: 'Layers',
          badgeColor: 'bg-amber-950 text-amber-400 border-amber-800/50',
        },
      ],
    },
    {
      title: 'Agent AI',
      items: [
        {
          id: 'ai-mentor',
          label: 'AI Mentor',
          icon: Bot,
          badge: 'Agent',
          badgeColor: 'bg-purple-950 text-purple-400 border-purple-800/50',
        },
      ],
    },
    {
      title: 'Agronomy & ML Tools',
      items: [
        {
          id: 'crop-planning',
          label: 'Crop Planning',
          icon: Sprout,
          badge: 'ML',
          badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800/50',
        },
        {
          id: 'irrigation',
          label: 'Irrigation',
          icon: Droplets,
          badge: 'FAO-56',
          badgeColor: 'bg-cyan-950 text-cyan-400 border-cyan-800/50',
        },
        {
          id: 'fertilizer',
          label: 'Fertilizer',
          icon: FlaskConical,
          badge: 'NPK',
          badgeColor: 'bg-indigo-950 text-indigo-400 border-indigo-800/50',
        },
        {
          id: 'disease-detection',
          label: 'Disease Detection',
          icon: ShieldAlert,
          badge: 'Vision',
          badgeColor: 'bg-rose-950 text-rose-400 border-rose-800/50',
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
        },
      ],
    },
  ];

  const handleNavClick = (tab: TabType) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-slate-900 border-r border-slate-800">
      <div className="overflow-y-auto">
        {/* Brand Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sprout className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                AgriNexus <span className="text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 font-mono">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Smart Agriculture System</p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / System Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 m-3 rounded-xl border">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <Compass className="w-3.5 h-3.5 text-emerald-400" /> AgriNexus Core
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">v1.0</span>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
          <Code2 className="w-3 h-3 text-slate-400" /> PostGIS • ML • Agent AI
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
