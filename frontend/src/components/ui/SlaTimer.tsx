import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const SlaTimer: React.FC<{ dueAt?: string; status: string }> = ({ dueAt, status }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isBreached, setIsBreached] = useState<boolean>(false);
  const [isNear, setIsNear] = useState<boolean>(false);

  useEffect(() => {
    if (!dueAt || ['Resolved', 'Closed'].includes(status)) {
      return;
    }

    const updateTimer = () => {
      const due = new Date(dueAt).getTime();
      const now = new Date().getTime();
      const diff = due - now;

      if (diff <= 0) {
        setIsBreached(true);
        const overdueMins = Math.abs(Math.floor(diff / 60000));
        setTimeLeft(`SLA Breached by ${Math.floor(overdueMins / 60)}h ${overdueMins % 60}m`);
      } else {
        setIsBreached(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours < 1) {
          setIsNear(true);
        }
        setTimeLeft(`${hours}h ${mins}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [dueAt, status]);

  if (!dueAt || ['Resolved', 'Closed'].includes(status)) {
    return (
      <span className="inline-flex items-center text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
        <Clock className="w-3 h-3 mr-1" /> SLA Met
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border ${
        isBreached
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
          : isNear
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          : 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {isBreached ? <AlertTriangle className="w-3 h-3 mr-1 text-rose-400" /> : <Clock className="w-3 h-3 mr-1 text-slate-400" />}
      {timeLeft}
    </span>
  );
};
