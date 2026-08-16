import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Archive,
  Inbox,
  AlertOctagon,
  BookOpen,
  ShieldCheck,
  BarChart3,
  PlusCircle,
  Users,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenCreateModal }) => {
  const { role } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets Directory', icon: TicketIcon },
    { id: 'history', label: 'History', icon: Archive },
  ];

  if (role === 'Technician' || role === 'TeamLead' || role === 'Admin') {
    navItems.push({ id: 'unassigned', label: 'Unassigned Queue', icon: Inbox });
    navItems.push({ id: 'critical', label: 'Critical Incidents', icon: AlertOctagon });
  }

  navItems.push({ id: 'kb', label: 'Knowledge Base', icon: BookOpen });

  if (role === 'TeamLead' || role === 'Admin') {
    navItems.push({ id: 'reports', label: 'Reports & SLA', icon: BarChart3 });
  }

  if (role === 'Admin') {
    navItems.push({ id: 'staff', label: 'Registered Staff Directory', icon: Users });
    navItems.push({ id: 'audit', label: 'Audit Trail', icon: ShieldCheck });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-0 bg-slate-900 border-r border-slate-800 p-4">
      {/* Create Ticket Primary CTA */}
      <button
        onClick={onOpenCreateModal}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition active:scale-98 flex-shrink-0"
      >
        <PlusCircle className="w-5 h-5" />
        <span>Report Technical Problem</span>
      </button>

      {/* Main Navigation Links */}
      <nav className="space-y-1 mt-6 flex-shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer pushes SLA card to bottom */}
      <div className="flex-1" />

      {/* SLA Support Card */}
      <div className="space-y-3 flex-shrink-0">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
          <p className="text-xs font-semibold text-slate-300">24/7 IT Help Desk</p>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Critical incidents responded within 15 minutes SLA.
          </p>
        </div>
      </div>
    </aside>
  );
};

