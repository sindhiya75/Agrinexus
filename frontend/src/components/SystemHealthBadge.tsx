import React from 'react';
import { HealthResponse } from '../types/health';
import { RefreshCw } from 'lucide-react';

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
  const isHealthy = !error && health?.status === 'healthy';
  const isDegraded = !error && health?.status === 'degraded';

  return (
    <button
      onClick={onRefresh}
      title={`Status: ${isHealthy ? 'Healthy' : isDegraded ? 'Degraded' : 'Offline'} (${responseTimeMs}ms). Click to refresh.`}
      className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200 transition-colors cursor-pointer"
    >
      <span className="relative flex h-2 w-2">
        {isHealthy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-rose-500'
          }`}
        />
      </span>
      <span className="text-[11px] text-neutral-600 font-medium">
        {isHealthy ? 'Online' : isDegraded ? 'Degraded' : 'Offline'}
      </span>
      {loading && <RefreshCw className="w-3 h-3 text-neutral-400 animate-spin" />}
    </button>
  );
};
export default SystemHealthBadge;
