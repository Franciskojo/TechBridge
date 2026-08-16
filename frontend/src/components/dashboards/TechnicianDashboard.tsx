import React, { useState } from 'react';
import { Ticket } from '../../types';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { SlaTimer } from '../ui/SlaTimer';
import { Inbox, UserCheck, AlertOctagon, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TechnicianDashboardProps {
  tickets: Ticket[];
  onSelectTicket: (t: Ticket) => void;
  onUpdateTicket: (t: Ticket) => void;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({ tickets, onSelectTicket, onUpdateTicket }) => {
  const { user } = useAuth();
  if (!user) return null;
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned' | 'critical'>('assigned');

  const myAssigned = tickets.filter((t) => t.assigned_technician_id === user.id && !['Closed'].includes(t.status));
  const unassigned = tickets.filter((t) => !t.assigned_technician_id && !['Closed'].includes(t.status));
  const critical = tickets.filter((t) => t.priority === 'Critical' && !['Closed'].includes(t.status));
  const overdue = tickets.filter((t) => t.sla_due_at && new Date(t.sla_due_at) < new Date() && !['Resolved', 'Closed'].includes(t.status));

  const handleClaim = (e: React.MouseEvent, t: Ticket) => {
    e.stopPropagation();
    const updated: Ticket = {
      ...t,
      assigned_technician_id: user.id,
      assignedTechnician: { id: user.id, name: user.name, email: user.email },
      status: t.status === 'New' ? 'Assigned' : t.status,
      updated_at: new Date().toISOString(),
    };
    onUpdateTicket(updated);
  };

  const currentList = activeTab === 'assigned' ? myAssigned : activeTab === 'unassigned' ? unassigned : critical;

  return (
    <div className="space-y-6">
      {/* Workbench Metric Banner Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('assigned')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'assigned' ? 'bg-blue-950/40 border-blue-500/50' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">My Assigned</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{myAssigned.length}</p>
        </div>

        <div
          onClick={() => setActiveTab('unassigned')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'unassigned' ? 'bg-amber-950/40 border-amber-500/50' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Unassigned Queue</span>
            <Inbox className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{unassigned.length}</p>
        </div>

        <div
          onClick={() => setActiveTab('critical')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            activeTab === 'critical' ? 'bg-rose-950/40 border-rose-500/50' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Critical Incidents</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-1">{critical.length}</p>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Overdue SLA</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{overdue.length}</p>
        </div>
      </div>

      {/* Workbench Queue Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'assigned' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Tickets ({myAssigned.length})
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'unassigned' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unassigned ({unassigned.length})
            </button>
            <button
              onClick={() => setActiveTab('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'critical' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical ({critical.length})
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="space-y-3">
          {currentList.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              No tickets found in this queue.
            </div>
          ) : (
            currentList.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-bold text-blue-400">{t.ticket_number}</span>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition">{t.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    <span>Reporter: {t.reporter?.name || 'Jane Doe'}</span>
                    <span>System: {t.system?.name || 'General'}</span>
                    <span>Category: {t.category?.name || 'General'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                  <SlaTimer dueAt={t.sla_due_at} status={t.status} />
                  {!t.assigned_technician_id && (
                    <button
                      onClick={(e) => handleClaim(e, t)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Claim Ticket
                    </button>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
