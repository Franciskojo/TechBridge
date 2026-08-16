import React, { useEffect, useState } from 'react';
import { Shield, Users, Server, Database, Activity, FileText } from 'lucide-react';
import { fetchSystemsApi, fetchUsersCountApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../context/PWAContext';
import { db } from '../../db/dexieDb';
import { useLiveQuery } from 'dexie-react-hooks';
import { ITSystem } from '../../types';

export const AdminDashboard: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { token } = useAuth();
  const { pendingSyncCount } = usePWA();
  const [registeredStaffCount, setRegisteredStaffCount] = useState<number>(0);
  const [systemsList, setSystemsList] = useState<ITSystem[]>([]);

  useEffect(() => {
    fetchUsersCountApi(token).then((count) => setRegisteredStaffCount(count));
    fetchSystemsApi().then((sys) => setSystemsList(sys));
  }, [token]);

  // Live query for Dexie IndexedDB pending sync records
  const dexiePendingCount = useLiveQuery(async () => {
    try {
      return await db.pendingTickets.count();
    } catch {
      return 0;
    }
  }, [], 0);

  // Dynamic calculations
  const activeSystemsCount = systemsList.filter((s) => s.status === 'operational').length;
  const totalSystemsCount = systemsList.length;
  const totalOfflineSyncs = (dexiePendingCount || 0) + pendingSyncCount;
  const systemUptimePercent = totalSystemsCount > 0
    ? ((activeSystemsCount / totalSystemsCount) * 100).toFixed(1) + '%'
    : '100%';

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-400" /> Enterprise System Administration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage Users, Departments, Systems, Audit Logs, and Security</p>
        </div>
        <button
          onClick={() => onNavigateTab('audit')}
          className="flex items-center space-x-1.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>View Audit Trail</span>
        </button>
      </div>

      {/* Dynamic Admin Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('staff')}
          className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 p-4 rounded-xl text-left transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-300">
            <span className="text-xs font-medium">Registered Staff</span>
            <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{registeredStaffCount.toLocaleString()}</p>
          <p className="text-[10px] text-blue-400 mt-1 font-medium underline">Click to view staff directory →</p>
        </button>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Systems</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {activeSystemsCount} <span className="text-xs font-normal text-slate-400">/ {totalSystemsCount}</span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">IndexedDB Offline Syncs</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalOfflineSyncs}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">System Uptime</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{systemUptimePercent}</p>
        </div>
      </div>

      {/* Organizational System Health Manager */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Monitored IT Systems & Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {systemsList.map((sys) => (
            <div key={sys.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{sys.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">CODE: {sys.code}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                  sys.status === 'operational'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                }`}
              >
                {sys.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



