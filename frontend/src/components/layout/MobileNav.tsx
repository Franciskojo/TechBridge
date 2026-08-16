import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Ticket as TicketIcon,
  PlusCircle,
  BookOpen,
  Menu,
  X,
  Archive,
  Inbox,
  AlertOctagon,
  BarChart3,
  ShieldCheck,
  LayoutDashboard,
  Key,
  LogOut,
  ChevronRight,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onOpenCreateModal }) => {
  const { user, role, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  // Build role-filtered navigation items identical to Desktop Sidebar
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Main' },
    { id: 'tickets', label: 'Tickets Directory', icon: TicketIcon, category: 'Main' },
    { id: 'history', label: 'History', icon: Archive, category: 'Main' },
  ];

  if (role === 'Technician' || role === 'TeamLead' || role === 'Admin') {
    navItems.push({ id: 'unassigned', label: 'Unassigned Queue', icon: Inbox, category: 'Operations' });
    navItems.push({ id: 'critical', label: 'Critical Incidents', icon: AlertOctagon, category: 'Operations' });
  }

  navItems.push({ id: 'kb', label: 'Knowledge Base', icon: BookOpen, category: 'Main' });

  if (role === 'TeamLead' || role === 'Admin') {
    navItems.push({ id: 'reports', label: 'Reports & SLA', icon: BarChart3, category: 'Management' });
  }

  if (role === 'Admin') {
    navItems.push({ id: 'staff', label: 'Registered Staff Directory', icon: UserIcon, category: 'Management' });
    navItems.push({ id: 'audit', label: 'Audit Trail', icon: ShieldCheck, category: 'Management' });
  }

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
            activeTab === 'dashboard' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
            activeTab === 'tickets' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TicketIcon className="w-5 h-5 mb-0.5" />
          <span>Tickets</span>
        </button>

        {/* Prominent Create Action Button */}
        <button
          onClick={onOpenCreateModal}
          className="flex flex-col items-center justify-center w-12 h-12 -mt-5 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 hover:bg-blue-500 transition active:scale-95 border-2 border-slate-900"
          title="Report Technical Problem"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('kb')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
            activeTab === 'kb' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Knowledge</span>
        </button>

        {/* Menu Drawer Trigger */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
            isMenuOpen ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </button>
      </div>

      {/* Full Mobile Navigation & Account Drawer */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:hidden bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setIsMenuOpen(false)}
        >
          <div className="w-full bg-slate-900 border-t border-slate-800 rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">{user?.name || 'TechBridge User'}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center">
                    <Shield className="w-3 h-3 mr-1 text-blue-400" />
                    <span>{user?.job_title || role}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Options List */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-2">Workspace Navigation</p>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-950/40 text-slate-300 hover:bg-slate-800 border border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Controls */}
              <div className="pt-3 border-t border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-2">Account Settings</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-200 hover:bg-blue-600/20 text-xs font-semibold transition"
                  >
                    <div className="flex items-center space-x-3">
                      <Key className="w-4 h-4 text-blue-400" />
                      <span>Change Password</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition"
                  >
                    <div className="flex items-center space-x-3">
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400/50" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
      )}
    </>
  );
};
