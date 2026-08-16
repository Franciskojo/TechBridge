import React from 'react';
import { TicketStatus } from '../../types';

export const StatusBadge: React.FC<{ status: TicketStatus | string; className?: string }> = ({ status, className = '' }) => {
  const styles: Record<string, string> = {
    'New': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-medium',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-medium',
    'Waiting for Reporter': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Waiting for Third Party': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'Resolved': 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 font-semibold',
    'Closed': 'bg-slate-700/50 text-slate-400 border-slate-600',
    'Escalated': 'bg-rose-600/20 text-rose-300 border-rose-500/40 font-bold',
    'Reopened': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    'Pending Sync': 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse font-bold',
  };

  const styleClass = styles[status] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs border ${styleClass} ${className}`}>
      {status === 'Pending Sync' && <span className="w-2 h-2 mr-1.5 rounded-full bg-amber-400 animate-ping" />}
      {status}
    </span>
  );
};
