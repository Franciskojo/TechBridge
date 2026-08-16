import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../context/PWAContext';
import { Wifi, WifiOff, RefreshCw, Download, User as UserIcon, Settings, Key, LogOut, ChevronDown } from 'lucide-react';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  onOpenSyncQueue: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectTicketId?: (ticketId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSyncQueue, activeTab, setActiveTab, onSelectTicketId }) => {
  const { user, role, logout } = useAuth();
  const { isOnline, pendingSyncCount, installPrompt, triggerInstall } = usePWA();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        {/* Brand & Online State */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
              TB
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center leading-none">
                TechBridge <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-1.5 border border-blue-500/30">PWA</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Enterprise Service Desk</p>
            </div>
          </div>

          {/* Connectivity Pill */}
          <div className="hidden sm:flex items-center ml-4">
            {isOnline ? (
              <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Wifi className="w-3 h-3 mr-1" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                <WifiOff className="w-3 h-3 mr-1" /> Offline Mode
              </span>
            )}
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Notification Bell */}
          <NotificationBell onNavigateToTicket={onSelectTicketId} />
          {/* Offline Sync Counter Button */}
          {pendingSyncCount > 0 && (
            <button
              onClick={onOpenSyncQueue}
              className="flex items-center space-x-1.5 text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1.5 rounded-lg transition animate-pulse"
              title="View pending offline tickets queue"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{pendingSyncCount} Pending Sync</span>
            </button>
          )}

          {/* PWA Install Button */}
          {installPrompt && (
            <button
              onClick={triggerInstall}
              className="flex items-center space-x-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg transition shadow-md shadow-blue-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* User Settings Dropdown in Navbar (Desktop) / Static Badge (Mobile) */}
          {user && (
            <div className="relative pl-2 border-l border-slate-800" ref={settingsRef}>
              {/* Desktop Dropdown Button */}
              <button
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border transition ${
                  isSettingsOpen
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
                title="Account Settings"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30 flex-shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-slate-200 leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5">{user.job_title || role}</p>
                </div>
                <div className="flex items-center space-x-1 ml-1 text-slate-400">
                  <Settings className={`w-4 h-4 transition-transform ${isSettingsOpen ? 'rotate-45 text-blue-400' : ''}`} />
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Mobile Static Profile Badge (No Dropdown Menu) */}
              <div className="md:hidden flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              {/* Desktop Navbar Dropdown Menu */}
              {isSettingsOpen && (
                <div className="hidden md:block absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/30 border border-transparent transition cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-blue-400" />
                    <span>Change Password</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 border border-transparent transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
      )}
    </>
  );
};

