import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PWAProvider } from './context/PWAContext';
// Always-visible shell components — kept as static imports
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { LoginPage } from './components/auth/LoginPage';
import { PriorityBadge } from './components/ui/PriorityBadge';
import { StatusBadge } from './components/ui/StatusBadge';
import { SlaTimer } from './components/ui/SlaTimer';
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner';
import { fetchTicketsApi } from './services/api';
import { Ticket } from './types';
import { Search, Ticket as TicketIcon, Loader2 } from 'lucide-react';

// Heavy route-level components — lazy loaded on first navigation
const EmployeeDashboard   = lazy(() => import('./components/dashboards/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const TechnicianDashboard = lazy(() => import('./components/dashboards/TechnicianDashboard').then(m => ({ default: m.TechnicianDashboard })));
const TeamLeadDashboard   = lazy(() => import('./components/dashboards/TeamLeadDashboard').then(m => ({ default: m.TeamLeadDashboard })));
const AdminDashboard      = lazy(() => import('./components/dashboards/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CreateTicketModal   = lazy(() => import('./components/tickets/CreateTicketModal').then(m => ({ default: m.CreateTicketModal })));
const TicketDetailModal   = lazy(() => import('./components/tickets/TicketDetailModal').then(m => ({ default: m.TicketDetailModal })));
const TicketHistory       = lazy(() => import('./components/tickets/TicketHistory').then(m => ({ default: m.TicketHistory })));
const SyncQueueModal      = lazy(() => import('./components/offline/SyncQueueModal').then(m => ({ default: m.SyncQueueModal })));
const KnowledgeBaseHub    = lazy(() => import('./components/kb/KnowledgeBaseHub').then(m => ({ default: m.KnowledgeBaseHub })));
const AuditLogViewer      = lazy(() => import('./components/admin/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const ReportDashboard     = lazy(() => import('./components/admin/ReportDashboard').then(m => ({ default: m.ReportDashboard })));
const StaffDirectoryViewer = lazy(() => import('./components/admin/StaffDirectoryViewer').then(m => ({ default: m.StaffDirectoryViewer })));

// Fallback spinner shown while a lazy chunk loads
const TabFallback = () => (
  <div className="flex items-center justify-center py-24 text-slate-500">
    <Loader2 className="w-6 h-6 animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Search & Filters for Ticket Directory Tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchTicketsApi(role, user?.id, user?.email).then((data) => {
        if (data && data.length > 0) {
          setTickets(data);
        }
      });
    }
  }, [role, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
          TB
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Initializing TechBridge Workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    setSelectedTicket(updatedTicket);
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setSelectedTicket(null);
    setIsDetailModalOpen(false);
  };

  const handleSelectTicket = (t: Ticket) => {
    setSelectedTicket(t);
    setIsDetailModalOpen(true);
  };

  const handleSelectTicketById = (ticketId: string) => {
    const found = tickets.find((t) => t.id === ticketId);
    if (found) {
      setSelectedTicket(found);
      setIsDetailModalOpen(true);
    }
  };

  // Tickets Directory filter (supports active tickets & resolved/closed history)
  const filteredTickets = tickets.filter((t) => {
    const isResolvedOrClosed = ['Resolved', 'Closed'].includes(t.status);

    if (statusFilter === 'history' || statusFilter === 'Resolved' || statusFilter === 'Closed') {
      if (!isResolvedOrClosed && statusFilter === 'history') return false;
      if (statusFilter !== 'history' && t.status !== statusFilter) return false;
    } else {
      if (isResolvedOrClosed) return false;
    }

    const matchesSearch =
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || statusFilter === 'history'
        ? true
        : t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16 md:pb-0">
      {/* Enterprise Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSyncQueue={() => setIsSyncModalOpen(true)}
        onSelectTicketId={handleSelectTicketById}
      />

      <div className="flex-1 flex" style={{ minHeight: 0 }}>
        {/* Desktop Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-0 max-w-7xl mx-auto w-full">
          <Suspense fallback={<TabFallback />}>
          {activeTab === 'dashboard' && (
            <>
              {role === 'Employee' && (
                <EmployeeDashboard
                  tickets={tickets}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onSelectTicket={handleSelectTicket}
                />
              )}
              {role === 'Technician' && (
                <TechnicianDashboard
                  tickets={tickets}
                  onSelectTicket={handleSelectTicket}
                  onUpdateTicket={handleUpdateTicket}
                />
              )}
              {role === 'TeamLead' && (
                <TeamLeadDashboard
                  tickets={tickets}
                  onSelectTicket={handleSelectTicket}
                />
              )}
              {role === 'Admin' && (
                <AdminDashboard onNavigateTab={(t) => setActiveTab(t)} />
              )}
            </>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center">
                    <TicketIcon className="w-5 h-5 mr-2 text-blue-400" /> Tickets Directory
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Global search, status filtering, and issue management</p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search ticket #, title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="all">All Active Tickets</option>
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for Reporter">Waiting for Reporter</option>
                    <option value="history">Ticket History (Resolved & Closed)</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Tickets Directory Table / Cards View */}
              <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                    No tickets match the search filters.
                  </div>
                ) : (
                  filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xs font-mono font-bold text-blue-400">{t.ticket_number}</span>
                          <StatusBadge status={t.status} />
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition">{t.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                          <span>Reporter: {t.reporter?.name || 'Jane Doe'}</span>
                          <span>Category: {t.category?.name || 'General'}</span>
                          <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <SlaTimer dueAt={t.sla_due_at} status={t.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'unassigned' && (
            <TechnicianDashboard
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
              onUpdateTicket={handleUpdateTicket}
            />
          )}

          {activeTab === 'critical' && (
            <TechnicianDashboard
              tickets={tickets.filter((t) => t.priority === 'Critical')}
              onSelectTicket={handleSelectTicket}
              onUpdateTicket={handleUpdateTicket}
            />
          )}

          {activeTab === 'kb' && <KnowledgeBaseHub />}
          {activeTab === 'reports' && <ReportDashboard />}
          {activeTab === 'staff' && <StaffDirectoryViewer />}
          {activeTab === 'audit' && <AuditLogViewer />}
          {activeTab === 'history' && (
            <TicketHistory tickets={tickets} onSelectTicket={handleSelectTicket} />
          )}
          </Suspense>
        </main>
      </div>

      {/* Mobile Touch Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* PWA Install Banner */}
      <PwaInstallBanner />

      {/* Modals — lazy loaded, Suspense renders nothing while chunk fetches */}
      <Suspense fallback={null}>
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onTicketCreated={handleTicketCreated}
        />

        <TicketDetailModal
          isOpen={isDetailModalOpen}
          ticket={selectedTicket}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdateTicket={handleUpdateTicket}
          onDeleteTicket={handleDeleteTicket}
        />

        <SyncQueueModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PWAProvider>
        <AppContent />
      </PWAProvider>
    </AuthProvider>
  );
}

export default App;
