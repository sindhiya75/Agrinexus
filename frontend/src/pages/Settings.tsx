import React from 'react';
import { Database, Server, ExternalLink, FileText } from 'lucide-react';
import { HealthResponse } from '../types/health';

interface SettingsProps {
  health: HealthResponse | null;
}

export const Settings: React.FC<SettingsProps> = ({ health }) => {
  return (
    <div className="space-y-5 max-w-4xl pb-12 font-sans">
      <div className="pb-1">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">System Settings & Diagnostics</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Backend services, database parameters, and API configuration.
        </p>
      </div>

      <div className="space-y-4">
        {/* Backend Config */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-forest-700" />
              API Services
            </h3>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Swagger /docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-neutral-500 block mb-0.5 font-sans text-[11px]">API Base URL</span>
              <span className="text-neutral-900 font-semibold">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-neutral-500 block mb-0.5 font-sans text-[11px]">Prefix</span>
              <span className="text-neutral-900 font-semibold">/api/v1</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-neutral-500 block mb-0.5 font-sans text-[11px]">Environment</span>
              <span className="text-neutral-900 font-semibold">{health?.environment || 'development'}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-neutral-500 block mb-0.5 font-sans text-[11px]">Core Service</span>
              <span className="text-neutral-900 font-semibold">{health?.service || 'AgriNexus AI'}</span>
            </div>
          </div>
        </div>

        {/* Database Config */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-forest-700" />
              PostgreSQL & PostGIS
            </h3>
            <span className="text-xs text-neutral-500">
              Port: 5432
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-neutral-500 block mb-0.5 font-sans text-[11px]">Database Name</span>
              <span className="text-neutral-900 font-semibold">{health?.database.database_name || 'agrinexus_db'}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-neutral-500 block mb-0.5 font-sans text-[11px]">Connection Status</span>
              <span className={health?.database.connected ? 'text-emerald-700 font-semibold font-sans' : 'text-rose-600 font-sans'}>
                {health?.database.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 sm:col-span-2">
              <span className="text-neutral-500 block mb-0.5 font-sans text-[11px]">PostGIS Geometry Extension</span>
              <span className={health?.database.postgis_installed ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}>
                {health?.database.postgis_version || (health?.database.postgis_installed ? 'Active' : 'Not Detected')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;
