import React from 'react';
import { Priority } from '../../types';

export const PriorityBadge: React.FC<{ priority: Priority; className?: string }> = ({ priority, className = '' }) => {
  const styles = {
    Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold animate-pulse',
    High: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold',
    Medium: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  }[priority] || 'bg-slate-500/10 text-slate-400';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${styles} ${className}`}>
      {priority === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-ping" />}
      {priority} Priority
    </span>
  );
};
