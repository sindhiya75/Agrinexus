import React from 'react';
import { HealthResponse } from '../types/health';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Database, Layers } from 'lucide-react';

interface SystemHealthBadgeProps {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  responseTimeMs: number;
  onRefresh: () => void;
}

export const SystemHealthBadge: React.FC<SystemHealthBadgeProps> = ({
  health,
  loading,
  error,
  responseTimeMs,
  onRefresh,
}) => {
  const isHealthy = health?.status === 'healthy';
  const isDegraded = health?.status === 'degraded';
  const isDown = !health || health?.status === 'unhealthy' || Boolean(error);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Backend Status */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        isHealthy
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
          : isDegraded
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      }`}>
        {isHealthy && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
        {isDegraded && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
        {isDown && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
        <span>
          Backend: {isHealthy ? 'Online' : isDegraded ? 'Degraded' : 'Offline'}
        </span>
        {health && (
          <span className="text-[10px] text-slate-400 font-mono">({responseTimeMs}ms)</span>
        )}
      </div>

      {/* PostgreSQL Status */}
      <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border ${
        health?.database.connected
          ? 'bg-slate-800/80 text-emerald-400 border-emerald-500/20'
          : 'bg-slate-900/80 text-slate-400 border-slate-700/50'
      }`}>
        <Database className="w-3.5 h-3.5" />
        <span>DB: {health?.database.connected ? 'PostgreSQL 16' : 'Disconnected'}</span>
      </div>

      {/* PostGIS Status */}
      <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border ${
        health?.database.postgis_installed
          ? 'bg-slate-800/80 text-sky-400 border-sky-500/20'
          : 'bg-slate-900/80 text-slate-400 border-slate-700/50'
      }`}>
        <Layers className="w-3.5 h-3.5" />
        <span>PostGIS: {health?.database.postgis_installed ? 'Active' : 'Missing'}</span>
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={loading}
        title="Check system health"
        className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50 border border-slate-700"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
      </button>
    </div>
  );
};
