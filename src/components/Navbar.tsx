import React from 'react';
import { User, UserRole } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  LayoutDashboard, 
  CalendarCheck, 
  CreditCard, 
  Users, 
  FileSpreadsheet, 
  RefreshCw,
  UserCheck,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onRoleSwitch: (role: UserRole) => void;
  activeTab: 'dashboard' | 'attendance' | 'fees' | 'students' | 'reports' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'fees' | 'students' | 'reports' | 'admin') => void;
  onResetData: () => void;
  onLogout: () => void;
  isFirebaseConnected?: boolean;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleSwitch,
  activeTab,
  setActiveTab,
  onResetData,
  onLogout,
  isFirebaseConnected = true,
  isSyncing = false,
}) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance' as const, label: 'Attendance Register', icon: CalendarCheck },
    { id: 'fees' as const, label: 'Fee Management', icon: CreditCard },
    { id: 'students' as const, label: 'Student Directory', icon: Users },
    { id: 'reports' as const, label: 'Reports & Defaulters', icon: FileSpreadsheet },
    ...(currentUser.role === 'admin'
      ? [{ id: 'admin' as const, label: 'Admin Console & Access', icon: ShieldCheck, privileged: true }]
      : []),
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-blue-700 flex items-center justify-center text-white shadow-sm border border-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base tracking-tight text-white">
                  CAMPUS REGISTRY
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Student Attendance & Fee Management System
              </p>
            </div>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Firebase Live Badge */}
            <div
              title="Real-time synchronization connected with Firebase Firestore"
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/90 border border-slate-700/80 rounded-md text-[11px] text-slate-300"
            >
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="font-semibold text-amber-300">Firebase</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{isSyncing ? 'Syncing...' : 'Connected'}</span>
            </div>

            {/* Quick Demo Reset */}
            <button
              id="btn-reset-demo-data"
              onClick={onResetData}
              title="Reset records to default institutional state in Firestore"
              className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded border border-slate-800 hover:border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              <span>Reset Cloud Data</span>
            </button>

            {/* Current User Pill */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1.5 border border-slate-700">
              <div className="flex items-center px-2 py-1 space-x-2">
                <div className="w-7 h-7 rounded bg-blue-900/60 border border-blue-700 text-blue-300 flex items-center justify-center font-semibold text-xs">
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-sky-400" />
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-medium text-slate-200">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Faculty Teacher'}
                  </div>
                </div>
              </div>

              {/* Role Switcher Toggle */}
              <div className="ml-2 pl-2 border-l border-slate-700 flex items-center space-x-1">
                <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Role:</span>
                <button
                  id="role-switch-admin"
                  onClick={() => onRoleSwitch('admin')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                    currentUser.role === 'admin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  Admin
                </button>
                <button
                  id="role-switch-teacher"
                  onClick={() => onRoleSwitch('teacher')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                    currentUser.role === 'teacher'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>

            {/* Log Out Button */}
            <button
              id="btn-navbar-logout"
              onClick={onLogout}
              title="Sign out to Login Screen"
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-1" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isPrivileged = 'privileged' in tab && tab.privileged;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium transition whitespace-nowrap ${
                    isActive
                      ? isPrivileged
                        ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-sm border border-indigo-500/40'
                        : 'bg-blue-700 text-white shadow-sm'
                      : isPrivileged
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isPrivileged && !isActive ? 'text-amber-400' : ''}`} />
                  <span>{tab.label}</span>
                  {isPrivileged && (
                    <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-bold uppercase font-mono">
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
