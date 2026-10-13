import React from 'react';
import { Settings as SettingsIcon, Database, Server } from 'lucide-react';
import { HealthResponse } from '../types/health';

interface SettingsProps {
  health: HealthResponse | null;
}

export const Settings: React.FC<SettingsProps> = ({ health }) => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold mb-2">
          <SettingsIcon className="w-3.5 h-3.5 text-emerald-400" /> Platform Configuration
        </div>
        <h1 className="text-2xl font-bold text-white">System Settings & Environment</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review environment parameters, API routing prefixes, and database connection strings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Backend Config */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-emerald-400" />
            Backend API Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">API Base URL</span>
              <span className="text-slate-200">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">API Prefix</span>
              <span className="text-slate-200">/api/v1</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Environment</span>
              <span className="text-emerald-400">{health?.environment || 'development'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Service Name</span>
              <span className="text-slate-200">{health?.service || 'AgriNexus AI'}</span>
            </div>
          </div>
        </div>

        {/* Database Config */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-sky-400" />
            PostgreSQL & PostGIS Connection Info
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Database Name</span>
              <span className="text-sky-300">{health?.database.database_name || 'agrinexus_db'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block mb-1">Database Port</span>
              <span className="text-slate-200">5432</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 col-span-1 md:col-span-2">
              <span className="text-slate-500 block mb-1">PostGIS Extension Status</span>
              <span className={health?.database.postgis_installed ? 'text-emerald-400' : 'text-slate-400'}>
                {health?.database.postgis_version || (health?.database.postgis_installed ? 'Enabled' : 'Not Connected')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
