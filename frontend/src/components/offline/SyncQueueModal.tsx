import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexieDb';
import { usePWA } from '../../context/PWAContext';
import { X, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface SyncQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncQueueModal: React.FC<SyncQueueModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, triggerManualSync, syncNotification, clearSyncNotification } = usePWA();
  const pendingTickets = useLiveQuery(() => db.pendingTickets.toArray(), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Offline Sync Queue Manager</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {syncNotification && (
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center justify-between">
              <span>{syncNotification}</span>
              <button onClick={clearSyncNotification} className="text-slate-400 hover:text-white font-bold ml-2">×</button>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-xs">
              <span className="text-slate-400">Connection Status: </span>
              {isOnline ? (
                <span className="font-bold text-emerald-400">Online</span>
              ) : (
                <span className="font-bold text-amber-400">Offline (Stored Locally)</span>
              )}
            </div>

            <button
              onClick={triggerManualSync}
              disabled={!isOnline}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Now</span>
            </button>
          </div>

          {!pendingTickets || pendingTickets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <p className="text-xs font-semibold text-slate-200">No Pending Offline Tickets</p>
              <p className="text-[11px] text-slate-400">All your local ticket drafts have been synchronized with the server.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTickets.map((draft) => (
                <div key={draft.tempId} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-amber-400">{draft.tempId}</span>
                    <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      {draft.syncStatus}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{draft.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{draft.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
