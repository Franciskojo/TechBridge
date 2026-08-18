import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Clock, CheckCircle2, Star, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL, authHeaders } from '../../services/api';

interface ReportSummary {
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
  sla_compliance_rate: number;
  avg_first_response_minutes: number;
  avg_resolution_hours: number;
  avg_satisfaction_rating: number;
  monthly_trend: Record<string, number>;
  total_tickets: number;
  open_tickets: number;
}

// Graceful fallback for offline / backend-not-running scenarios
const DEMO_SUMMARY: ReportSummary = {
  by_status: { 'New': 4, 'In Progress': 7, 'Resolved': 18, 'Closed': 31 },
  by_priority: { 'Low': 12, 'Medium': 24, 'High': 14, 'Critical': 10 },
  by_type: { 'Incident': 28, 'Security Concern': 10, 'General Support Request': 22 },
  sla_compliance_rate: 96.4,
  avg_first_response_minutes: 14,
  avg_resolution_hours: 3.2,
  avg_satisfaction_rating: 4.9,
  monthly_trend: {},
  total_tickets: 60,
  open_tickets: 11,
};

const fetchReportSummary = async (): Promise<ReportSummary> => {
  const token = localStorage.getItem('techbridge_token');
  const res = await fetch(`${API_BASE_URL}/reports/summary`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch report summary');
  return res.json();
};

const StatCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, sub, color, icon }) => (
  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-slate-700 transition">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-slate-400 font-semibold">{label}</p>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
    </div>
    <p className={`text-3xl font-black ${color.replace('bg-', 'text-').replace('/20', '-400')}`}>{value}</p>
    <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
  </div>
);

const BreakdownBar: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400">{count} <span className="text-slate-500">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const ReportDashboard: React.FC = () => {
  const { data, isLoading, isError } = useQuery<ReportSummary>({
    queryKey: ['report-summary'],
    queryFn: fetchReportSummary,
    // Fall back to demo data on error rather than showing nothing
    placeholderData: DEMO_SUMMARY,
  });

  const summary = data ?? DEMO_SUMMARY;

  const handleExportCsv = () => {
    const token = localStorage.getItem('techbridge_token');
    // Attach token via query param for file download (browser navigation)
    window.open(`${API_BASE_URL}/reports/export-csv?token=${token ?? ''}`, '_blank');
  };

  const priorityColors: Record<string, string> = {
    Critical: 'bg-rose-500',
    High: 'bg-orange-500',
    Medium: 'bg-amber-400',
    Low: 'bg-slate-400',
  };

  const statusColors: Record<string, string> = {
    'New': 'bg-sky-500',
    'In Progress': 'bg-blue-500',
    'Escalated': 'bg-rose-500',
    'Waiting for Reporter': 'bg-amber-400',
    'Resolved': 'bg-emerald-500',
    'Closed': 'bg-slate-500',
    'Assigned': 'bg-violet-500',
    'Under Review': 'bg-purple-500',
  };

  const totalByStatus = Object.values(summary.by_status).reduce((a, b) => a + b, 0);
  const totalByPriority = Object.values(summary.by_priority).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            IT Support Analytics &amp; Reports
            {isLoading && <Loader2 className="w-4 h-4 ml-2 text-slate-400 animate-spin" />}
            {isError && (
              <span className="ml-2 text-xs text-amber-400 font-normal flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> Demo data (backend offline)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">SLA Compliance, Ticket Volume, and Performance Metrics</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={String(summary.total_tickets)}
          sub={`${summary.open_tickets} currently open`}
          color="bg-blue-500/20"
          icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
        />
        <StatCard
          label="Avg First Response"
          value={`${summary.avg_first_response_minutes} min`}
          sub="Target: 30 minutes SLA"
          color="bg-sky-500/20"
          icon={<Clock className="w-4 h-4 text-sky-400" />}
        />
        <StatCard
          label="Avg Resolution Time"
          value={`${summary.avg_resolution_hours} hrs`}
          sub={`SLA Compliance: ${summary.sla_compliance_rate}%`}
          color="bg-emerald-500/20"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Satisfaction Rating"
          value={`${summary.avg_satisfaction_rating} / 5`}
          sub="Based on resolved tickets"
          color="bg-amber-500/20"
          icon={<Star className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Priority */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Tickets by Priority</h3>
          <div className="space-y-3">
            {['Critical', 'High', 'Medium', 'Low'].map((priority) => (
              <BreakdownBar
                key={priority}
                label={priority}
                count={summary.by_priority[priority] ?? 0}
                total={totalByPriority}
                color={priorityColors[priority] ?? 'bg-slate-500'}
              />
            ))}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Tickets by Status</h3>
          <div className="space-y-3">
            {Object.entries(summary.by_status)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <BreakdownBar
                  key={status}
                  label={status}
                  count={count}
                  total={totalByStatus}
                  color={statusColors[status] ?? 'bg-slate-500'}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Ticket Types */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Tickets by Type</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(summary.by_type).map(([type, count]) => (
            <div key={type} className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2 flex flex-col items-center min-w-[120px]">
              <p className="text-2xl font-black text-white">{count}</p>
              <p className="text-[11px] text-slate-400 text-center mt-0.5">{type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
