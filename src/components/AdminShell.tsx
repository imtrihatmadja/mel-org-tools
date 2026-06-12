import React, { useState } from 'react';
import { LocationData } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Menu,
  X,
  LayoutDashboard,
  MapPin,
  FileText,
  ShieldAlert,
  Users2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Search,
  Bell,
  CheckCircle2,
  Database,
  Plus,
  LogIn,
  Chrome
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
  activeTab: string;
  onActiveTabChange: (tabId: string) => void;
  userEmail?: string;
  yearFilter: number;
  onYearFilterChange: (year: number) => void;
  locations?: LocationData[];
  onOpenAddLocation?: () => void;
  isLoggedIn?: boolean;
  onLoginToggle?: () => void;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  children,
  activeTab,
  onActiveTabChange,
  userEmail = "admin@dfw.or.id",
  yearFilter,
  onYearFilterChange,
  locations = [],
  onOpenAddLocation,
  isLoggedIn = true,
  onLoginToggle
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const menuItems: { id: string; label: string; icon: any }[] = [
    { id: 'nasional', label: 'Ringkasan Nasional', icon: LayoutDashboard },
    { id: 'penerima-manfaat', label: 'Pekerja Terjangkau (Excel)', icon: Users2 },
    ...locations.map(loc => ({
      id: loc.id,
      label: `${loc.name}, ${loc.province}`,
      icon: MapPin,
    }))
  ];

  const handleNavClick = (id: string) => {
    onActiveTabChange(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col md:flex-row font-sans text-slate-800" id="admin-shell-layout">
      
      {/* 1. SIDEBAR (Desktop: sticky, side panel. Mobile: overlay drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 text-slate-700 transform transition-transform duration-300 md:translate-x-0 md:static md:flex md:flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        id="dashboard-sidebar-rail"
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-black select-none text-sm">
              D
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-sm tracking-tight leading-tight">DFW ORG MEL</span>
              <span className="text-[9px] text-blue-600 font-mono font-bold tracking-wider">tools monitoring pekerja</span>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-md hover:bg-slate-50 text-slate-400 md:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <span className="px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-2">
            Wilayah Jaringan Pantau
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                <span className="text-right flex-1 ml-3 truncate pr-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-700/75 shrink-0 ml-1" />}
              </button>
            );
          })}

          {onOpenAddLocation && (
            <button
              onClick={() => {
                onOpenAddLocation();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-200 mt-2 hover:border-indigo-400 cursor-pointer transition-all uppercase tracking-wider"
              title="Tambah Wilayah atau Pelabuhan Baru"
            >
              <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Tambah Lokasi</span>
            </button>
          )}

          <div className="pt-6 border-t border-slate-100 mt-6 select-none">
            <span className="px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-2">
              Taksonomi Isu Utama
            </span>
            <div className="space-y-1.5 text-[10px] text-slate-500 px-2 font-sans">
              <div className="flex items-center gap-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                <span>Hak Ketenagakerjaan & Gaji</span>
              </div>
              <div className="flex items-center gap-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                <span>Kerja Paksa & Kekerasan</span>
              </div>
              <div className="flex items-center gap-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></span>
                <span>Imigrasi & ABK Hilang</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Database Integration Monitor Indicator */}
        <div className="mx-4 my-2 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 font-sans">
          <div className="flex items-center gap-2 mb-1.5">
            <Database className={`w-3.5 h-3.5 shrink-0 ${isSupabaseConfigured ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Integrasi Database</span>
          </div>
          {isSupabaseConfigured ? (
            <div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-bold text-slate-800">Supabase Cloud Terhubung</span>
              </div>
              <p className="text-[9px] text-slate-450 mt-1 leading-normal">
                Data input akan langsung disinkronkan ke peladen PostgreSQL Supabase secara real-time.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[11px] font-bold text-slate-700">Offline / Mode Demo</span>
              </div>
              <p className="text-[9px] text-slate-450 mt-1 leading-normal font-medium">
                Data disimpan di memori klien. Isikan kredensial Supabase di berkas .env Anda untuk mengaktifkan database real.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold font-mono text-sm uppercase shrink-0 transition-colors ${
              isLoggedIn 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}>
              {isLoggedIn ? userEmail.substring(0, 2) : 'G'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {isLoggedIn ? userEmail : 'Mode Guest / Tamu'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {isLoggedIn ? 'Koordinator Jaringan' : 'Pengunjung Umum'}
              </span>
            </div>
          </div>

          {/* Social Google Connection Status Button triggers simulation of auth state toggle */}
          {isLoggedIn ? (
            <button
              onClick={onLoginToggle}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-250 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer bg-white"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
              Keluar Sesi (Logout)
            </button>
          ) : (
            <button
              onClick={onLoginToggle}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:text-indigo-700 hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer bg-white"
            >
              <Chrome className="w-3.5 h-3.5 text-blue-500" />
              Login dengan Google
            </button>
          )}
        </div>
      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR HEADER */}
        <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]" id="top-navbar-header">
          {/* Mobile menu toggle, and Page title indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-slate-800 font-medium hidden sm:flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase font-mono">ID</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Dashboard pengorganisasian DFW Indonesia</span>
            </div>
          </div>

          {/* Quick Toolbar Filters */}
          <div className="flex items-center gap-4">
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden lg:inline">Filter Tahun:</span>
              <select
                value={yearFilter}
                onChange={(e) => onYearFilterChange(Number(e.target.value))}
                className="bg-slate-5 font-medium border border-slate-200 rounded-lg text-xs py-1.5 px-3 text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 cursor-pointer transition-all"
              >
                <option value={2026}>2026 (Tahun Ini)</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
              </select>
            </div>

            {/* Notification Indicator Bell */}
            <button className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* 3. SCROLLABLE BODY CANVAS */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay Background for accessibility click-close */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/30 z-30 md:hidden backdrop-blur-sm"
        />
      )}
    </div>
  );
};
export default AdminShell;
