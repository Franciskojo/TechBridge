import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Loader2, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { AuditLogItem } from '../../types';

const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1',
    actor_name: 'Jane Doe',
    action: 'OFFLINE_TICKET_DRAFTED',
    resource_type: 'Ticket',
    resource_id: 'TEMP-1722173000',
    new_values: { title: 'Cannot access ERP Financial Reports module', impact: 'High' },
    ip_address: '10.0.4.12',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'aud-2',
    actor_name: 'Alex Rivera',
    action: 'TICKET_STATUS_CHANGED',
    resource_type: 'Ticket',
    resource_id: 'TB-202607-0001',
    new_values: { old_status: 'New', new_status: 'In Progress' },
    ip_address: '10.0.1.45',
    created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
  },
  {
    id: 'aud-3',
    actor_name: 'Enterprise Admin',
    action: 'USER_LOGIN',
    resource_type: 'User',
    resource_id: 'usr-admin-1',
    new_values: { role: 'Admin' },
    ip_address: '10.0.0.1',
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
];

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  USER_LOGOUT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  USER_REGISTERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  TICKET_CREATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  TICKET_STATUS_CHANGED: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  TICKET_ASSIGNED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  TICKET_ESCALATED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  TICKET_UPDATED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  KB_ARTICLE_CREATED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  KB_ARTICLE_FROM_TICKET: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  ATTACHMENT_UPLOADED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  OFFLINE_TICKET_SYNCED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  OFFLINE_TICKET_DRAFTED: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

const fetchAuditLogs = async (): Promise<AuditLogItem[]> => {
  const token = localStorage.getItem('techbridge_token');
  const res = await fetch('/api/v1/audit-logs', {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  const data = await res.json();
  return data.data || data;
};

export const AuditLogViewer: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useQuery<AuditLogItem[]>({
    queryKey: ['audit-logs'],
    queryFn: fetchAuditLogs,
    placeholderData: MOCK_AUDIT_LOGS,
    staleTime: 1000 * 30, // 30 seconds — audit logs should feel fresh
  });

  const logs = (data ?? MOCK_AUDIT_LOGS).filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.actor_name.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.resource_type.toLowerCase().includes(q) ||
      log.resource_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-blue-400" />
            Immutable Security Audit Trail
            {(isLoading || isFetching) && <Loader2 className="w-4 h-4 ml-2 text-slate-400 animate-spin" />}
            {isError && (
              <span className="ml-2 text-xs text-amber-400 font-normal flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> Demo data (backend offline)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Recording every ticket state change, authentication event, and system action</p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by actor, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => refetch()}
            title="Refresh audit log"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-2 transition"
          >
            <RefreshCw className={`w-4 h-4 text-slate-300 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Resource</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No audit log entries match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionStyle = ACTION_COLORS[log.action] ?? 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-slate-200">{log.actor_name}</td>
                      <td className="p-3.5">
                        <span className={`border px-2 py-0.5 rounded font-bold ${actionStyle}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 whitespace-nowrap">
                        {log.resource_type}:{log.resource_id}
                      </td>
                      <td className="p-3.5 text-slate-400">{log.ip_address ?? '—'}</td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">
                        {log.new_values ? JSON.stringify(log.new_values) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
