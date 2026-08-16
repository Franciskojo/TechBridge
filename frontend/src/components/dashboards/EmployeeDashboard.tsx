import React, { useState, useEffect } from 'react';
import { Ticket, KnowledgeArticle } from '../../types';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { PlusCircle, Search, HelpCircle, AlertCircle, CheckCircle2, Ticket as TicketIcon, BarChart2, Clock, Inbox, ArrowRight, Layers } from 'lucide-react';
import { fetchKnowledgeArticlesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface EmployeeDashboardProps {
  tickets: Ticket[];
  onOpenCreateModal: () => void;
  onSelectTicket: (t: Ticket) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ tickets, onOpenCreateModal, onSelectTicket }) => {
  const { token } = useAuth();
  const [searchKb, setSearchKb] = useState<string>('');
  const [kbList, setKbList] = useState<KnowledgeArticle[]>([]);
  const [activeFilter, setActiveFilter] = useState<'open' | 'history' | 'action' | 'all'>('open');

  useEffect(() => {
    fetchKnowledgeArticlesApi(token).then((data) => setKbList(data));
  }, [token]);

  // Analytics counts & ticket arrays
  const openTickets = tickets.filter((t) => !['Resolved', 'Closed'].includes(t.status));
  const waitingResponse = tickets.filter((t) => ['Waiting for Reporter', 'Awaiting Confirmation'].includes(t.status));
  const recentlyResolved = tickets.filter((t) => ['Resolved', 'Closed'].includes(t.status));

  const filteredKb = kbList.filter((kb) =>
    kb.title.toLowerCase().includes(searchKb.toLowerCase()) || kb.body.toLowerCase().includes(searchKb.toLowerCase())
  );

  // Tickets to display based on active analytics filter card selection
  const displayTickets =
    activeFilter === 'open'
      ? openTickets
      : activeFilter === 'history'
      ? recentlyResolved
      : activeFilter === 'action'
      ? waitingResponse
      : tickets;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">IT Service & Support Portal</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Report workplace technical problems, track support progress, and browse self-service solutions.
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition active:scale-95 text-xs whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Technical Problem</span>
        </button>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: My Open Tickets Analytics */}
        <div
          onClick={() => setActiveFilter('open')}
          className={`p-4 rounded-2xl border transition cursor-pointer group ${
            activeFilter === 'open'
              ? 'bg-blue-950/50 border-blue-500/60 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-300">
            <span className="text-xs font-semibold">My Open Tickets</span>
            <TicketIcon className={`w-4 h-4 transition ${activeFilter === 'open' ? 'text-blue-400 scale-110' : 'text-blue-400/70'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-extrabold text-white">{openTickets.length}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">In progress & assigned</p>
        </div>

        {/* Card 2: Ticket History Analytics */}
        <div
          onClick={() => setActiveFilter('history')}
          className={`p-4 rounded-2xl border transition cursor-pointer group ${
            activeFilter === 'history'
              ? 'bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-300">
            <span className="text-xs font-semibold">Ticket History</span>
            <CheckCircle2 className={`w-4 h-4 transition ${activeFilter === 'history' ? 'text-emerald-400 scale-110' : 'text-emerald-400/70'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-extrabold text-emerald-400">{recentlyResolved.length}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Resolved & Closed
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Completed requests</p>
        </div>

        {/* Card 3: Action Required Analytics */}
        <div
          onClick={() => setActiveFilter('action')}
          className={`p-4 rounded-2xl border transition cursor-pointer group ${
            activeFilter === 'action'
              ? 'bg-amber-950/50 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-300">
            <span className="text-xs font-semibold">Action Required</span>
            <AlertCircle className={`w-4 h-4 transition ${activeFilter === 'action' ? 'text-amber-400 scale-110' : 'text-amber-400/70'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-extrabold text-amber-400">{waitingResponse.length}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              waitingResponse.length > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {waitingResponse.length > 0 ? 'Action Needed' : 'Clear'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting your response</p>
        </div>

        {/* Card 4: Total Logged Analytics */}
        <div
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer group ${
            activeFilter === 'all'
              ? 'bg-purple-950/50 border-purple-500/60 ring-1 ring-purple-500/40 shadow-lg shadow-purple-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-300">
            <span className="text-xs font-semibold">Total Logged</span>
            <Layers className={`w-4 h-4 transition ${activeFilter === 'all' ? 'text-purple-400 scale-110' : 'text-purple-400/70'}`} />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-extrabold text-white">{tickets.length}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              All Tickets
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Lifetime requests</p>
        </div>
      </div>

      {/* Action Required Alert Banner (if any ticket waiting for employee confirmation/input) */}
      {waitingResponse.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-amber-300">Action Required on {waitingResponse.length} Ticket(s)</p>
              <p className="text-[11px] text-amber-200/80">Support team requested additional info or requested resolution confirmation.</p>
            </div>
          </div>
          <button
            onClick={() => onSelectTicket(waitingResponse[0])}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            Review Ticket
          </button>
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Selected Analytics Ticket List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header & Quick Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center">
              {activeFilter === 'open' && (
                <>
                  <TicketIcon className="w-4 h-4 mr-2 text-blue-400" /> My Open Tickets Analytics ({openTickets.length})
                </>
              )}
              {activeFilter === 'history' && (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Ticket History Analytics ({recentlyResolved.length})
                </>
              )}
              {activeFilter === 'action' && (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 text-amber-400" /> Action Required Analytics ({waitingResponse.length})
                </>
              )}
              {activeFilter === 'all' && (
                <>
                  <BarChart2 className="w-4 h-4 mr-2 text-purple-400" /> All Logged Tickets Analytics ({tickets.length})
                </>
              )}
            </h3>

            {/* Sub-tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setActiveFilter('open')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activeFilter === 'open' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Open ({openTickets.length})
              </button>
              <button
                onClick={() => setActiveFilter('history')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activeFilter === 'history' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                History ({recentlyResolved.length})
              </button>
              <button
                onClick={() => setActiveFilter('action')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activeFilter === 'action' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Action Needed ({waitingResponse.length})
              </button>
            </div>
          </div>

          {/* Ticket List View */}
          {displayTickets.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
              <h4 className="text-sm font-bold text-white">No Tickets in this Category</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeFilter === 'open'
                  ? 'All your reported technical issues have been resolved. Click above if you need help with anything.'
                  : activeFilter === 'history'
                  ? 'No resolved or closed tickets found in your history.'
                  : activeFilter === 'action'
                  ? 'No tickets currently require your input or confirmation.'
                  : 'You have not submitted any technical tickets yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayTickets.map((t) => {
                const isResolved = ['Resolved', 'Closed'].includes(t.status);
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className={`border rounded-xl p-4 transition cursor-pointer space-y-2 group ${
                      isResolved
                        ? 'bg-emerald-950/20 hover:bg-emerald-900/30 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${isResolved ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {t.ticket_number}
                      </span>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition">{t.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>

                    {t.resolution_summary && isResolved && (
                      <p className="text-xs text-emerald-300/80 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20 line-clamp-2">
                        <span className="font-semibold text-emerald-400">Resolution:</span> {t.resolution_summary}
                      </p>
                    )}

                    <div
                      className={`flex items-center justify-between text-[11px] pt-2 border-t ${
                        isResolved ? 'text-slate-400 border-emerald-500/20' : 'text-slate-500 border-slate-800/80'
                      }`}
                    >
                      <span>Category: {t.category?.name || 'General'}</span>
                      <span>
                        {isResolved
                          ? `Resolved: ${t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : new Date(t.updated_at).toLocaleDateString()}`
                          : `Created: ${new Date(t.created_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Knowledge Base Quick Help */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center">
            <HelpCircle className="w-4 h-4 mr-2 text-blue-400" /> Self-Service Knowledge Base
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchKb}
              onChange={(e) => setSearchKb(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2.5">
            {filteredKb.slice(0, 4).map((kb) => (
              <div key={kb.id} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl hover:border-slate-700 transition">
                <h4 className="text-xs font-semibold text-slate-200">{kb.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{kb.body.replace(/[#*]/g, '')}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span>{kb.views} views</span>
                  <span className="text-emerald-400 font-semibold">{kb.helpful_count} helpful ratings</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

