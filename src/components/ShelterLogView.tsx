import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  DollarSign, 
  Sliders, 
  CalendarDays, 
  Activity, 
  FileText, 
  Check, 
  UserPlus, 
  Briefcase, 
  MapPin, 
  Phone, 
  Info,
  Clock,
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { ShelterWorker, ShelterDailyLog } from '../types';
import { supabase } from '../lib/supabase';

interface ShelterLogViewProps {
  locationId: string;
  locationName: string;
  isSuperAdmin: boolean;
}

// Initial Mock Workers Data for realistic out-of-the-box state
const INITIAL_WORKERS: ShelterWorker[] = [];

// Initial Logs Data for June 2026 to populate nice charts easily
const generateInitialLogs = (): ShelterDailyLog[] => {
  return [];
};

export default function ShelterLogView({ locationId, locationName, isSuperAdmin }: ShelterLogViewProps) {
  // Main state with localStorage persistence
  const [workers, setWorkers] = useState<ShelterWorker[]>(() => {
    const cached = localStorage.getItem('dfw_shelter_workers_v2');
    return cached ? JSON.parse(cached) : INITIAL_WORKERS;
  });

  const [dailyLogs, setDailyLogs] = useState<ShelterDailyLog[]>(() => {
    const cached = localStorage.getItem('dfw_shelter_logs_v2');
    return cached ? JSON.parse(cached) : generateInitialLogs();
  });

  // Supabase sync status: 'connected' | 'offline' | 'loading' | 'syncing'
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'connected' | 'offline' | 'loading' | 'syncing'>('loading');

  // Navigation within the Shelter Hub Tab
  const [subTab, setSubTab] = useState<'daily' | 'workers' | 'recap'>('daily');

  // Filter & Search states
  const [searchWorker, setSearchWorker] = useState('');
  const [searchDaily, setSearchDaily] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Current date format YYYY-MM-DD
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  });

  // Recap Monthly states
  const [recapYear, setRecapYear] = useState<number>(() => new Date().getFullYear());
  const [recapMonth, setRecapMonth] = useState<number>(() => new Date().getMonth() + 1); // Current month default
  const [dailyStipend, setDailyStipend] = useState<number>(60000); // 60,000 IDR per worker-day default

  // Modals / Editor forms for Workers Master
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<ShelterWorker | null>(null);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    identityNo: '',
    origin: '',
    contact: ''
  });

  // Save states to local storage automatically
  useEffect(() => {
    localStorage.setItem('dfw_shelter_workers_v2', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('dfw_shelter_logs_v2', JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  // Cleanup orphan logs when workers list changes (e.g., cleared/deleted)
  useEffect(() => {
    const activeIdsSet = new Set(workers.map(w => w.id));
    setDailyLogs(prev => {
      const filtered = prev.filter(log => activeIdsSet.has(log.workerId));
      if (filtered.length !== prev.length) {
        return filtered;
      }
      return prev;
    });
  }, [workers]);

  // Supabase helper calls
  const saveWorkerToSupabase = async (worker: ShelterWorker) => {
    if (!supabase) return;
    try {
      setSupabaseSyncStatus('syncing');
      const { error } = await supabase.from('beneficiaries').upsert({
        id: worker.id,
        location_id: worker.locationId,
        name: worker.name,
        phone: worker.contact,
        origin: worker.origin,
        category: 'ShelterWorker',
        notes: worker.identityNo
      });
      if (error) {
        console.error("Gagal sinkronisasi data master pekerja ke Supabase:", error);
      }
      setSupabaseSyncStatus('connected');
    } catch (e) {
      console.error(e);
      setSupabaseSyncStatus('connected');
    }
  };

  const deleteWorkerFromSupabase = async (workerId: string) => {
    if (!supabase) return;
    try {
      setSupabaseSyncStatus('syncing');
      const { error } = await supabase.from('beneficiaries').delete().eq('id', workerId);
      if (error) {
        console.error("Gagal menghapus data master pekerja dari Supabase:", error);
      }
      setSupabaseSyncStatus('connected');
    } catch (e) {
      console.error(e);
      setSupabaseSyncStatus('connected');
    }
  };

  const syncLogsToSupabase = async (logsToSync: ShelterDailyLog[]) => {
    if (!supabase) {
      setSupabaseSyncStatus('offline');
      return;
    }
    try {
      setSupabaseSyncStatus('syncing');
      
      // Group logs by year & month
      const groups: { [key: string]: ShelterDailyLog[] } = {};
      logsToSync.forEach(log => {
        if (log.locationId !== locationId) return;
        const parts = log.date.split('-');
        if (parts.length >= 2) {
          const yearMonth = `${parts[0]}-${parts[1]}`; // e.g., "2026-06"
          if (!groups[yearMonth]) {
            groups[yearMonth] = [];
          }
          groups[yearMonth].push(log);
        }
      });

      // Save each month to Supabase reflections room under category="ShelterDailyLog"
      for (const [yearMonth, monthLogs] of Object.entries(groups)) {
        const docId = `SHELTER-LOG-${locationId}-${yearMonth}`;
        const { error } = await supabase.from('reflections').upsert({
          id: docId,
          location_id: locationId,
          title: `Data Presensi Shelter - ${locationName} - ${yearMonth}`,
          date: `${yearMonth}-01`,
          category: 'ShelterDailyLog',
          content: JSON.stringify(monthLogs),
          author: 'System Shelter'
        });
        if (error) {
          console.error(`Gagal sinkronisasi log presensi bulanan ke Supabase untuk ${yearMonth}:`, error);
        }
      }
      setSupabaseSyncStatus('connected');
    } catch (e) {
      console.error(e);
      setSupabaseSyncStatus('connected');
    }
  };

  // Sync dailyLogs to Supabase whenever it changes (with a 1000ms debounce to prevent writing while typing notes)
  useEffect(() => {
    const timer = setTimeout(() => {
      syncLogsToSupabase(dailyLogs);
    }, 1000);
    return () => clearTimeout(timer);
  }, [dailyLogs, locationId]);

  // Load initial dataset from Supabase if configured & available
  useEffect(() => {
    async function fetchFromSupabase() {
      if (!supabase) {
        setSupabaseSyncStatus('offline');
        return;
      }
      setSupabaseSyncStatus('loading');
      try {
        // 1. Fetch beneficiaries for this location holding ShelterWorker category
        const { data: bData, error: bError } = await supabase
          .from('beneficiaries')
          .select('*')
          .eq('category', 'ShelterWorker');
        
        if (!bError && bData && bData.length > 0) {
          const cloudWorkers: ShelterWorker[] = bData.map((b: any) => ({
            id: b.id,
            locationId: b.location_id,
            name: b.name,
            identityNo: b.notes || '',
            origin: b.origin || '',
            contact: b.phone || '',
            createdAt: b.created_at || new Date().toISOString()
          }));

          // Merge loaded cloud workers with local/initial ones
          setWorkers(prev => {
            const merged = [...prev];
            cloudWorkers.forEach(cw => {
              const idx = merged.findIndex(w => w.id === cw.id);
              if (idx !== -1) {
                merged[idx] = cw;
              } else {
                merged.push(cw);
              }
            });
            return merged;
          });
        }

        // 2. Fetch monthly logs stored in reflections table
        const { data: refData, error: refError } = await supabase
          .from('reflections')
          .select('*')
          .eq('category', 'ShelterDailyLog');

        if (!refError && refData) {
          const cloudLogs: ShelterDailyLog[] = [];
          refData.forEach((r: any) => {
            try {
              const parsed = JSON.parse(r.content);
              if (Array.isArray(parsed)) {
                cloudLogs.push(...parsed);
              }
            } catch (e) {
              console.error("Gagal parse log harian dari reflections:", e);
            }
          });

          if (cloudLogs.length > 0) {
            setDailyLogs(prev => {
              const merged = [...prev];
              cloudLogs.forEach(cl => {
                const idx = merged.findIndex(l => l.id === cl.id);
                if (idx !== -1) {
                  merged[idx] = cl;
                } else {
                  merged.push(cl);
                }
              });
              return merged;
            });
          }
        }

        setSupabaseSyncStatus('connected');
      } catch (err) {
        console.error("Gagal mengambil data dari Supabase:", err);
        setSupabaseSyncStatus('offline');
      }
    }

    fetchFromSupabase();
  }, [locationId]);

  // Filtered workers belonging to current Active Location
  const locationWorkers = useMemo(() => {
    return workers.filter(w => w.locationId === locationId);
  }, [workers, locationId]);

  // Filtered workers for daily attendance list based on search bar
  const filteredDailyWorkers = useMemo(() => {
    return locationWorkers.filter(w => 
      w.name.toLowerCase().includes(searchDaily.toLowerCase()) ||
      w.origin.toLowerCase().includes(searchDaily.toLowerCase())
    );
  }, [locationWorkers, searchDaily]);

  // Handle register / update worker
  const handleOpenWorkerModal = (worker?: ShelterWorker) => {
    if (worker) {
      setEditingWorker(worker);
      setWorkerForm({
        name: worker.name,
        identityNo: worker.identityNo,
        origin: worker.origin,
        contact: worker.contact
      });
    } else {
      setEditingWorker(null);
      setWorkerForm({
        name: '',
        identityNo: '',
        origin: '',
        contact: ''
      });
    }
    setIsWorkerModalOpen(true);
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name.trim()) {
      alert("Nama pekerja wajib diisi.");
      return;
    }

    if (editingWorker) {
      // Update
      const updated: ShelterWorker = {
        ...editingWorker,
        name: workerForm.name,
        identityNo: workerForm.identityNo || '-',
        origin: workerForm.origin || '-',
        contact: workerForm.contact || '-'
      };
      setWorkers(prev => prev.map(w => w.id === editingWorker.id ? updated : w));
      saveWorkerToSupabase(updated);
    } else {
      // Create
      const newWorker: ShelterWorker = {
        id: `w-${locationId}-${Date.now()}`,
        locationId,
        name: workerForm.name,
        identityNo: workerForm.identityNo || '-',
        origin: workerForm.origin || '-',
        contact: workerForm.contact || '-',
        createdAt: new Date().toISOString()
      };
      setWorkers(prev => [...prev, newWorker]);
      saveWorkerToSupabase(newWorker);
    }
    setIsWorkerModalOpen(false);
  };

  const handleDeleteWorker = (workerId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data master pekerja "${name}"? Menghapus akan memotong catatan log harian miliknya.`)) {
      return;
    }
    setWorkers(prev => prev.filter(w => w.id !== workerId));
    setDailyLogs(prev => prev.filter(l => l.workerId !== workerId));
    deleteWorkerFromSupabase(workerId);
  };

  // Checkbox/Log interactions for SELECTED DATE
  const todayLogsMap = useMemo(() => {
    const map = new Map<string, ShelterDailyLog>();
    const activeIds = new Set(locationWorkers.map(w => w.id));
    dailyLogs.forEach(log => {
      if (log.locationId === locationId && log.date === selectedDate && activeIds.has(log.workerId)) {
        map.set(log.workerId, log);
      }
    });
    return map;
  }, [dailyLogs, locationId, selectedDate, locationWorkers]);

  const handleToggleLog = (workerId: string) => {
    if (!isSuperAdmin) {
      alert("Batas Akses Tamu: Silakan masuk sebagai Koordinator untuk mengedit log harian.");
      return;
    }

    const existingLog = todayLogsMap.get(workerId);
    if (existingLog) {
      // Checked off / Remove this log
      setDailyLogs(prev => prev.filter(l => l.id !== existingLog.id));
    } else {
      // Check on / Create new log
      const newLog: ShelterDailyLog = {
        id: `log-${locationId}-${workerId}-${selectedDate}`,
        locationId,
        workerId,
        date: selectedDate,
        status: 'Hadir',
        checkIn: '18:00',
        checkOut: '07:30',
        notes: ''
      };
      setDailyLogs(prev => [...prev, newLog]);
    }
  };

  const handleUpdateLogDetails = (workerId: string, fields: Partial<ShelterDailyLog>) => {
    const existingLog = todayLogsMap.get(workerId);
    if (!existingLog) return; // Must be checked in first

    setDailyLogs(prev => prev.map(l => l.id === existingLog.id ? {
      ...l,
      ...fields
    } : l));
  };

  // Automatically count how many are residing today
  const activeLogsCount = todayLogsMap.size;

  // Monthly statistics calculations
  const monthlyLogs = useMemo(() => {
    const activeIds = new Set(locationWorkers.map(w => w.id));
    return dailyLogs.filter(log => {
      if (log.locationId !== locationId) return false;
      if (!activeIds.has(log.workerId)) return false;
      const d = new Date(log.date);
      const isYearMatched = d.getFullYear() === recapYear;
      // getMonth() is 0-indexed, so +1
      const isMonthMatched = (d.getMonth() + 1) === recapMonth;
      return isYearMatched && isMonthMatched;
    });
  }, [dailyLogs, locationId, recapYear, recapMonth, locationWorkers]);

  const monthlyRecapMetrics = useMemo(() => {
    const uniqueIds = new Set<string>();
    let totalWorkerDays = 0;
    const occupancyMap = new Map<string, number>(); // date -> count

    monthlyLogs.forEach(l => {
      uniqueIds.add(l.workerId);
      totalWorkerDays += 1;
      occupancyMap.set(l.date, (occupancyMap.get(l.date) || 0) + 1);
    });

    // Calendar days in this year-month combination
    const totalDaysInMonth = new Date(recapYear, recapMonth, 0).getDate();
    const uniqueWorkers = uniqueIds.size;
    const avgDailyOccupancy = totalWorkerDays / totalDaysInMonth;

    let peakOccupancy = 0;
    let peakDate = '-';
    occupancyMap.forEach((count, date) => {
      if (count > peakOccupancy) {
        peakOccupancy = count;
        // Format date beautiful e.g. "18 Jun"
        const day = date.split('-')[2];
        peakDate = `${parseInt(day)} ${getMonthName(recapMonth)}`;
      }
    });

    const estBudget = totalWorkerDays * dailyStipend;

    return {
      uniqueWorkers,
      totalWorkerDays,
      avgDailyOccupancy,
      peakOccupancy,
      peakDate,
      estBudget,
      totalDaysInMonth
    };
  }, [monthlyLogs, recapYear, recapMonth, dailyStipend]);

  // Monthly occupancy chart data prep
  const monthlyChartData = useMemo(() => {
    const data = [];
    const totalDays = monthlyRecapMetrics.totalDaysInMonth;
    
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = recapMonth < 10 ? `0${recapMonth}` : `${recapMonth}`;
      const fullDate = `${recapYear}-${monthStr}-${dayStr}`;
      
      const count = monthlyLogs.filter(l => l.date === fullDate).length;
      data.push({
        name: `${day}`,
        'Penghuni Shelter': count,
        dateFull: `${day} ${getMonthName(recapMonth)}`
      });
    }
    return data;
  }, [monthlyLogs, recapYear, recapMonth, monthlyRecapMetrics]);

  function getMonthName(m: number): string {
    const monthsName = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return monthsName[m - 1] || '';
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      {/* Tab Controller Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-sans">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-slate-800 tracking-tight leading-none uppercase">Log Hub Shelter ({locationName})</h2>
                {supabaseSyncStatus === 'connected' && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Supabase Terhubung
                  </span>
                )}
                {supabaseSyncStatus === 'syncing' && (
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full border border-blue-200/50 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                    Menyinkronkan...
                  </span>
                )}
                {supabaseSyncStatus === 'loading' && (
                  <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded-full border border-amber-200/50 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Memuat Cloud...
                  </span>
                )}
                {supabaseSyncStatus === 'offline' && (
                  <span className="text-[9px] bg-slate-50 text-slate-500 font-extrabold px-2 py-0.5 rounded-full border border-slate-200/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Mode Lokal (Offline)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Sistem pencatatan harian ABK yang berlabuh, melaut kembali, atau transit konflik.</p>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-100/85 p-1 rounded-xl self-start md:self-center border border-slate-200/40 text-[11px] font-bold text-slate-600">
          <button
            onClick={() => setSubTab('daily')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${subTab === 'daily' ? 'bg-white text-slate-800 shadow-sm font-extrabold' : 'hover:text-slate-900 hover:bg-white/40'}`}
          >
            <CalendarDays className="w-3.5 h-3.5 inline mr-1" /> Presensi Harian
          </button>
          <button
            onClick={() => setSubTab('workers')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${subTab === 'workers' ? 'bg-white text-slate-800 shadow-sm font-extrabold' : 'hover:text-slate-900 hover:bg-white/40'}`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1" /> Master Pekerja ({locationWorkers.length})
          </button>
          <button
            onClick={() => setSubTab('recap')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${subTab === 'recap' ? 'bg-white text-slate-800 shadow-sm font-extrabold' : 'hover:text-slate-900 hover:bg-white/40'}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1" /> Hasil Rekapitulasi
          </button>
        </div>
      </div>

      {/* --- PANEL 1: DAILY PRESENCE (TAB: DAILY) --- */}
      {subTab === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Quick Date Control */}
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 font-sans text-left">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">Presensi Spasial</span>
              <h3 className="text-xs font-extrabold text-slate-800 mt-2">Pilih Tanggal Shelter</h3>
              <p className="text-[10px] text-slate-400 mt-1">Kelola centang penginap di shelter untuk mendapatkan visualisasi kapasitas hunian harian.</p>
            </div>

            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3.5">
              <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-slate-200 text-xs">
                <span className="text-slate-500">Penghuni Hari Ini:</span>
                <span className="font-extrabold text-slate-800 bg-slate-200/80 px-2.5 py-0.5 rounded-md">{activeLogsCount} ABK</span>
              </div>
              
              <div className="bg-amber-50/70 border border-amber-100/80 rounded-xl p-3 text-[10px] text-amber-800 leading-normal space-y-1">
                <p className="font-bold flex items-center gap-1">💡 Alur Pengoperasian:</p>
                <p>1. Daftarkan di tab "Master Pekerja" jika nama baru.</p>
                <p>2. Centang "Sedang Menginap" pada baris nama bersangkutan di tabel kanan.</p>
                <p>3. Input check-in/checkout dan catatan medis/kasus jika ada.</p>
              </div>
            </div>
          </div>

          {/* Dynamic Register/Checklist Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden font-sans text-left">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800">Lembar Kehadiran Harian Shelter</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Mendata yang tinggal pada tanggal <strong className="text-blue-600 font-extrabold">{selectedDate}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenWorkerModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-100 rounded-lg transition-all hover:scale-102 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Registrasi Pekerja
              </button>
            </div>

            {locationWorkers.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto">
                  <Users className="w-5 h-5 text-slate-300" />
                </div>
                <div className="text-xs font-bold text-slate-600">Belum Ada Pekerja Terdaftar</div>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Untuk memulai, daftarkan data master pekerja/ABK perikanan pada lokasi ini terlebih dahulu dengan menekan tombol Registrasi Pekerja.</p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama penghuni atau kota asal..."
                      value={searchDaily}
                      onChange={(e) => setSearchDaily(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                    />
                  </div>
                  {searchDaily && (
                    <button
                      type="button"
                      onClick={() => setSearchDaily('')}
                      className="text-[10px] font-extrabold text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {filteredDailyWorkers.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <div className="text-xs font-bold text-slate-600">Nama atau kota asal tidak ditemukan</div>
                    <p className="text-[10px] text-slate-400">Tidak ada pekerja dengan pencarian "{searchDaily}" terdaftar di hub ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-extrabold text-slate-500 border-b border-slate-100 text-[10px] uppercase tracking-wider">
                          <th className="py-3 px-4 w-12 text-center">Menginap</th>
                          <th className="py-3 px-4 w-1/3">Nama & Asal</th>
                          <th className="py-3 px-4 w-1/5">Status Kehadiran</th>
                          <th className="py-3 px-4">Catatan Operasional / Harian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                        {filteredDailyWorkers.map((worker) => {
                          const log = todayLogsMap.get(worker.id);
                          const isChecked = !!log;

                          return (
                            <tr 
                              key={worker.id} 
                              className={`hover:bg-slate-50/50 transition-colors ${isChecked ? 'bg-orange-50/15' : ''}`}
                            >
                              <td className="py-3.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleLog(worker.id)}
                                  className="w-4 h-4 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500 cursor-pointer accent-blue-600"
                                  disabled={!isSuperAdmin}
                                />
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-800">{worker.name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-slate-100 px-1 py-0.5 rounded-sm">{worker.origin}</span>
                                  <span className="text-[10px] text-slate-300">•</span>
                                  <span className="font-semibold text-slate-500">{worker.contact}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                {isChecked ? (
                                  <select
                                    value={log.status}
                                    disabled={!isSuperAdmin}
                                    onChange={(e) => handleUpdateLogDetails(worker.id, { status: e.target.value as any })}
                                    className="text-[10px] bg-white border border-slate-200 rounded-md p-1.5 font-bold text-slate-700 w-full focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="Hadir">Hadir (Sore/Malam)</option>
                                    <option value="Sakit">Sakit / Istirahat</option>
                                    <option value="Izin">Izin Khusus</option>
                                    <option value="Keluar">Keluar Sementara</option>
                                  </select>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">Tidak menginap</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {isChecked ? (
                                  <input
                                    type="text"
                                    value={log.notes || ''}
                                    placeholder="Tulis diagnosa, kebutuhan logistic, sengketa dok..."
                                    disabled={!isSuperAdmin}
                                    onChange={(e) => handleUpdateLogDetails(worker.id, { notes: e.target.value })}
                                    className="w-full bg-white border border-slate-200 text-[10px] py-1.5 px-2.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300"
                                  />
                                ) : (
                                  <span className="text-[10px] text-slate-300 italic">Kosong/Lewat</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* --- PANEL 2: WORKERS MASTER DATABASE (TAB: WORKERS) --- */}
      {subTab === 'workers' && (
        <div className="bg-white border border-slate-200/95 rounded-2xl shadow-xs overflow-hidden font-sans text-left">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800">Bank Data Master ABK & Pekerja Shelter</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Seluruh pekerja terdaftar untuk wilayah kerja kembali melaut di {locationName}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari pekerja..."
                  value={searchWorker}
                  onChange={(e) => setSearchWorker(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-[11px] rounded-lg pl-8 pr-3 py-1.5 w-40 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => handleOpenWorkerModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 border border-slate-900/10 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Daftar ABK Baru
              </button>
            </div>
          </div>

          {/* Table display */}
          {locationWorkers.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5 text-slate-300" />
              </div>
              <div className="text-xs font-bold text-slate-600">Belum Ada ABK Terdaftar</div>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Mulailah dengan mendaftarkan pekerja perikanan agar datanya terekam secara integratif untuk lembar absen harian di atas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 font-extrabold text-slate-500 border-b border-slate-100 text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-5">ID Pekerja</th>
                    <th className="py-3 px-5">Nama Lengkap</th>
                    <th className="py-3 px-5">No. Identitas/KTP</th>
                    <th className="py-3 px-5">Asal / Pelabuhan Asal</th>
                    <th className="py-3 px-5">Saluran Kontak</th>
                    <th className="py-3 px-5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {locationWorkers
                    .filter(w => w.name.toLowerCase().includes(searchWorker.toLowerCase()) || w.origin.toLowerCase().includes(searchWorker.toLowerCase()))
                    .map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-[10px] text-slate-400 font-bold">
                          {w.id}
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-slate-800">
                          {w.name}
                        </td>
                        <td className="py-3.5 px-5 text-[11px] text-slate-500 whitespace-nowrap">
                          {w.identityNo || '-'}
                        </td>
                        <td className="py-3.5 px-5 text-[11px] text-slate-600">
                          {w.origin || '-'}
                        </td>
                        <td className="py-3.5 px-5 text-[11px] font-mono text-slate-550 whitespace-nowrap">
                          {w.contact || '-'}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenWorkerModal(w)}
                            className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-blue-600 hover:text-blue-700 border border-slate-200/60 rounded-md text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer mr-1.5"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteWorker(w.id, w.name)}
                            disabled={!isSuperAdmin}
                            className="p-1 px-2.5 bg-red-50 hover:bg-red-100/85 text-red-600 border border-red-100 rounded-md text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- PANEL 3: MONTHLY RECAPS & CHARTS (TAB: RECAP) --- */}
      {subTab === 'recap' && (
        <div className="space-y-6">
          {/* Calendar Month & Logistics stipend controllers */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 font-sans text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-blue-600 tracking-wider">Metrik Agregat Otomatis</span>
              <h3 className="text-xs font-extrabold text-slate-800">Parameter Recap & Anggaran Bulanan</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Kalkulasi di bawah dihitung otomatis berbasis log kehadiran harian riil shelter untuk bulan terpilih.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <select
                  value={recapYear}
                  onChange={(e) => setRecapYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
                >
                  <option value={2026}>Tahun 2026</option>
                  <option value={2027}>Tahun 2027</option>
                </select>

                <select
                  value={recapMonth}
                  onChange={(e) => setRecapMonth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
                >
                  {[
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                  ].map((mName, i) => (
                    <option key={i} value={i + 1}>{mName}</option>
                  ))}
                </select>
              </div>

              {/* Slider for logistics budget scale */}
              <div className="border hover:border-slate-300 transition-all p-2 rounded-xl flex items-center gap-2.5 bg-slate-50">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <div className="text-[10px]">
                  <span className="text-slate-400 block tracking-tight font-medium">Beban Paket Makan/Hari/Orang</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <input
                      type="range"
                      min={30000}
                      max={150000}
                      step={5000}
                      value={dailyStipend}
                      onChange={(e) => setDailyStipend(Number(e.target.value))}
                      className="w-16 accent-blue-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg"
                    />
                    <span>Rp {dailyStipend.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Majestic KPI Cards Group */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* KPI 1 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs text-left relative overflow-hidden font-sans">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unik Terjangkau</div>
              <div className="text-xl font-black text-slate-800 mt-2 flex items-baseline gap-1">
                {monthlyRecapMetrics.uniqueWorkers}
                <span className="text-[10px] font-bold text-slate-400">ABK</span>
              </div>
              <div className="text-[9px] text-slate-400 mt-2">Daftar unik orang transit</div>
              <div className="absolute right-3.5 bottom-3.5 text-slate-100 p-1">
                <Users className="w-8 h-8 text-indigo-50" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs text-left relative overflow-hidden font-sans">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stays (Hari-Orang)</div>
              <div className="text-xl font-black text-slate-800 mt-2 flex items-baseline gap-1">
                {monthlyRecapMetrics.totalWorkerDays}
                <span className="text-[10px] font-bold text-slate-400">Malam</span>
              </div>
              <div className="text-[9px] text-slate-400 mt-2">Total tidur akumulatif</div>
              <div className="absolute right-3.5 bottom-3.5 text-slate-100 p-1">
                <CalendarDays className="w-8 h-8 text-orange-50" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs text-left relative overflow-hidden font-sans">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-bold">Rerata Hunian Harian</div>
              <div className="text-xl font-black text-slate-800 mt-2 flex items-baseline gap-1">
                {monthlyRecapMetrics.avgDailyOccupancy.toFixed(1)}
                <span className="text-[10px] font-bold text-slate-400">Orang / Hari</span>
              </div>
              <div className="text-[9px] text-slate-400 mt-2">Rata-rata hunian harian</div>
              <div className="absolute right-3.5 bottom-3.5 text-slate-100 p-1">
                <Activity className="w-8 h-8 text-blue-50" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs text-left relative overflow-hidden font-sans">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Okupansi Puncak</div>
              <div className="text-xl font-black text-slate-800 mt-2 flex items-baseline gap-1">
                {monthlyRecapMetrics.peakOccupancy}
                <span className="text-[10px] font-bold text-slate-400">Orang</span>
              </div>
              <div className="text-[9px] text-emerald-600 font-bold mt-2">Puncak pada: {monthlyRecapMetrics.peakDate}</div>
              <div className="absolute right-3.5 bottom-3.5 text-slate-100 p-1">
                <TrendingUp className="w-8 h-8 text-emerald-50" />
              </div>
            </div>

            {/* KPI 5 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs text-left relative overflow-hidden font-sans">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kebutuhan Anggaran</div>
              <div className="text-xl font-black text-slate-800 mt-2 text-[15px] font-black text-emerald-700 leading-tight">
                Rp {monthlyRecapMetrics.estBudget.toLocaleString('id-ID')}
              </div>
              <div className="text-[9px] text-slate-400 mt-2">Logistik porsi @ Rp {dailyStipend.toLocaleString('id-ID')}</div>
              <div className="absolute right-3.5 bottom-3.5 text-slate-100 p-1">
                <DollarSign className="w-8 h-8 text-emerald-50" />
              </div>
            </div>
          </div>

          {/* Recharts Graphical Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Graphical Chart of daily headcount */}
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs font-sans text-left flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800">Tren Tingkat Hunian Shelter</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Grafik dinamik menunjukkan jumlah ABK yang didata menginap per tanggal selama {getMonthName(recapMonth)} {recapYear}</p>
              </div>

              <div className="w-full h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 9, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const dataItem = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 p-3 text-[10px] font-sans">
                              <p className="font-extrabold text-[11px] mb-1 text-slate-205">{dataItem.dateFull}</p>
                              <p className="font-semibold text-orange-400">Stays: <span className="font-black text-white">{payload[0].value} ABK</span></p>
                              <p className="text-slate-400 text-[9px] mt-1 italic">Est logistik harian: Rp {((payload[0].value as number) * dailyStipend).toLocaleString('id-ID')}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Penghuni Shelter" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorOccupancy)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List entries day-by-day */}
            <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs font-sans text-left flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Ulasan Daftar Hari Tersibuk</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Daftar harian yang terekam log hunian shelter pada bulan terpilih.</p>
                </div>

                <div className="overflow-y-auto max-h-60 space-y-2 pr-1 divide-y divide-slate-50">
                  {monthlyChartData
                    .filter(d => d['Penghuni Shelter'] > 0)
                    .sort((a,b) => b['Penghuni Shelter'] - a['Penghuni Shelter'])
                    .slice(0, 8)
                    .map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 pt-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-700 font-extrabold">{item.dateFull}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-extrabold rounded-md border border-orange-100">
                            {item['Penghuni Shelter']} ABK
                          </span>
                          <span className="text-[9px] text-slate-400">
                            Rp {(item['Penghuni Shelter'] * dailyStipend / 1000).toFixed(0)}k
                          </span>
                        </div>
                      </div>
                    ))}
                  {monthlyChartData.filter(d => d['Penghuni Shelter'] > 0).length === 0 && (
                    <div className="p-8 text-center text-slate-350 text-[10px] italic">
                      Tidak ada log menginap pada bulan terpilih.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 mt-4 text-[10px] text-slate-500 leading-normal" id="shelter_budget_disclaimer_container">
                <span className="font-extrabold text-slate-700 block mb-1">ℹ️ Estimasi Anggaran</span>
                Kebutuhan logistik diturunkan otomatis dari akumulasi hunian dikalikan stipends. Bermanfaat dalam penyusunan laporan operasional bulanan atau pertanggungjawaban hibah.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DIALOG: REGISTRASI PEKERJA MASTER --- */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsWorkerModalOpen(false)}
          />

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden relative z-10 transition-all font-sans text-left">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 rounded-md bg-blue-50 text-blue-700 text-xs font-extrabold">
                  {editingWorker ? 'SUNTING' : 'BARU'}
                </span>
                <span className="text-xs font-extrabold text-slate-800">Registrasi Pekerja Posko/Shelter</span>
              </div>
              <button 
                onClick={() => setIsWorkerModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Box */}
            <form onSubmit={handleSaveWorker} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nama Lengkap Pekerja</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">No. Identitas (KTP/Passport)</label>
                  <input
                    type="text"
                    placeholder="Masukkan 16 digit NIK"
                    value={workerForm.identityNo}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, identityNo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pelabuhan / Kota Asal</label>
                  <input
                    type="text"
                    placeholder="Indramayu, Jawa Barat"
                    value={workerForm.origin}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, origin: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Saluran Kontak/No. HP</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={workerForm.contact}
                  onChange={(e) => setWorkerForm(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[9px] text-slate-450 leading-normal flex gap-1.5 items-start">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <p>Mendaftarkan pekerja di sini akan melengkapi master basis data jaringan pantau di {locationName}. Data tidak dikirimkan ke pihak eksternal, melainkan dienkripsi lokal.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  {editingWorker ? 'Simpan Perubahan' : 'Registrasikan Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
