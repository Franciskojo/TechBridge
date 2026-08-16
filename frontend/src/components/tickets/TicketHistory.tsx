import React, { useState } from 'react';
import { Ticket } from '../../types';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { History, Search, CheckCircle2, XCircle, Filter, CalendarCheck2 } from 'lucide-react';

interface TicketHistoryProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const TicketHistory: React.FC<TicketHistoryProps> = ({ tickets, onSelectTicket }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Resolved' | 'Closed'>('all');

  // Only show resolved or closed tickets
  const historyTickets = tickets.filter((t) => {
    const isArchived = t.status === 'Resolved' || t.status === 'Closed';
    if (!isArchived) return false;

    const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;

    const matchesSearch =
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;
  const closedCount = tickets.filter((t) => t.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <History className="w-5 h-5 mr-2 text-emerald-400" />
            Ticket History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Archive of all resolved and closed tickets
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">{resolvedCount} Resolved</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">{closedCount} Closed</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search history by ticket # or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Resolved' | 'Closed')}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none cursor-pointer"
          >
            <option value="all">All Archived</option>
            <option value="Resolved">Resolved Only</option>
            <option value="Closed">Closed Only</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {historyTickets.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <CalendarCheck2 className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-slate-400">No archived tickets found</p>
            <p className="text-xs text-slate-600 mt-1">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Resolved and closed tickets will appear here.'}
            </p>
          </div>
        ) : (
          historyTickets.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectTicket(t)}
              className="bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-emerald-500/30 rounded-xl p-4 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group opacity-85 hover:opacity-100"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-emerald-400 transition">
                    {t.ticket_number}
                  </span>
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </div>
                <h4 className="text-xs font-bold text-slate-300 group-hover:text-white transition">
                  {t.title}
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>Reporter: {t.reporter?.name || 'Jane Doe'}</span>
                  <span>Category: {t.category?.name || 'General'}</span>
                  <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                  {t.resolved_at && (
                    <span className="text-emerald-500/70">
                      Resolved: {new Date(t.resolved_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    t.status === 'Resolved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {t.status === 'Resolved' ? '✓ Resolved' : '✗ Closed'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
