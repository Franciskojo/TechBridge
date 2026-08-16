import React from 'react';
import { Ticket } from '../../types';
import { BarChart3, Clock, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const TeamLeadDashboard: React.FC<{ tickets: Ticket[]; onSelectTicket: (t: Ticket) => void }> = ({ tickets, onSelectTicket }) => {
  const openCount = tickets.filter((t) => !['Closed'].includes(t.status)).length;
  const criticalCount = tickets.filter((t) => t.priority === 'Critical' && !['Closed'].includes(t.status)).length;
  const unassignedCount = tickets.filter((t) => !t.assigned_technician_id && !['Closed'].includes(t.status)).length;
  const resolvedCount = tickets.filter((t) => ['Resolved', 'Closed'].includes(t.status)).length;

  return (
    <div className="space-y-6">
      {/* Team Lead Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" /> IT Support Team Lead Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">SLA Compliance, Technician Workload & Major Incidents</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">SLA Target Compliance:</span>
          <span className="font-bold text-emerald-400 text-sm">96.8%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Total Active Volume</p>
          <p className="text-2xl font-extrabold text-white mt-1">{openCount}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Critical Incidents</p>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{criticalCount}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Unassigned Queue</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{unassignedCount}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Resolved This Week</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Workload Distribution */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technician Workload & SLA Targets</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="font-bold text-white">Alex Rivera (Senior Specialist)</p>
              <p className="text-[11px] text-slate-400">Assigned: 4 tickets (1 High, 3 Medium)</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              100% SLA Met
            </span>
          </div>

          <div className="flex items-center justify-between text-xs p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="font-bold text-white">Sarah Connor (Lead Specialist)</p>
              <p className="text-[11px] text-slate-400">Assigned: 2 tickets (1 Critical, 1 High)</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              95% SLA Met
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
