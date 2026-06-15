import React, { useState, useMemo, useEffect } from 'react';
import mockData from './data/mockData';
import { LocationData, Case, IssueCategory, LocationStats, HistoricalTrend, Beneficiary, Champion, WorkerOrganization, Reflection } from './types';
import AdminShell from './components/AdminShell';
import { fetchAllDataFromSupabase, supabase } from './lib/supabase';
import IndonesiaMap from './components/IndonesiaMap';
import KPICards from './components/KPICards';
import Charts from './components/Charts';
import CasesList from './components/CasesList';
import ReflectionsList from './components/ReflectionsList';
import NationalReflectionsList from './components/NationalReflectionsList';
import ChampionsList from './components/ChampionsList';
import OrganizationsList from './components/OrganizationsList';
import TimelineView from './components/TimelineView';
import SimulationPanel from './components/SimulationPanel';
import KPIEditModal from './components/KPIEditModal';
import BeneficiariesList from './components/BeneficiariesList';
import {
  Map,
  Layers,
  Award,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Users,
  Briefcase,
  HelpCircle,
  FileCheck2,
  ListFilter,
  Plus,
  X,
  MapPin,
  Edit,
  Trash2,
  ShieldAlert,
  Lock,
  Key,
  Chrome
} from 'lucide-react';

const PRESET_PORTS = [
  { name: 'Belawan', province: 'Sumatera Utara', x: 22, y: 35 },
  { name: 'Cilacap', province: 'Jawa Tengah', x: 35, y: 70 },
  { name: 'Surabaya', province: 'Jawa Timur', x: 42, y: 71 },
  { name: 'Ambon', province: 'Maluku', x: 74, y: 48 },
  { name: 'Sorong', province: 'Papua Barat', x: 79, y: 38 },
  { name: 'Tual', province: 'Maluku', x: 76, y: 55 },
  { name: 'Pontianak', province: 'Kalimantan Barat', x: 35, y: 43 },
  { name: 'Makassar', province: 'Sulawesi Selatan', x: 55, y: 58 },
  { name: 'Pemangkat', province: 'Kalimantan Barat', x: 30, y: 33 },
  { name: 'Kendari', province: 'Sulawesi Tenggara', x: 62, y: 46 },
];

const getIndonesianDate = () => {
  const date = new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function App() {
  const [locations, setLocations] = useState<LocationData[]>(mockData.locations);
  const [nationalTrend, setNationalTrend] = useState<HistoricalTrend[]>(mockData.nationalTrend);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number>(2026);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [forceAddReflection, setForceAddReflection] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('admin@dfw.or.id');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [superadminPassword, setSuperadminPassword] = useState(() => {
    return localStorage.getItem('DFW_SUPERADMIN_PASSWORD') || 'admin123';
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);

  // Integrasi Autentikasi Real-Time dengan Supabase Cloud (Google Login)
  useEffect(() => {
    if (!supabase) {
      // Jika offline, set ke admin@dfw.or.id secara default saat login true
      setCurrentUserEmail('admin@dfw.or.id');
      return;
    }

    // Pembersihan URL Hash setelah Google login sukses dirujuk balik
    if (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token='))) {
      // Beri jeda sangat singkat agar engine Supabase internal membaca hash token terlebih dahulu
      setTimeout(() => {
        try {
          // Bersihkan hash dari URL address bar tanpa memicu refresh halaman
          window.history.replaceState(
            null, 
            document.title, 
            window.location.pathname + window.location.search
          );
        } catch (e) {
          console.error("Gagal merapikan URL hash:", e);
        }
      }, 500);
    }

    // 1. Cek sesi login saat inisialisasi aplikasi
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || 'admin@dfw.or.id');
      } else {
        setIsLoggedIn(false);
        setCurrentUserEmail('Mode Guest / Tamu');
      }
    });

    // 2. Dengarkan perubahan state autentikasi dari Supabase secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || 'admin@dfw.or.id');
      } else {
        setIsLoggedIn(false);
        setCurrentUserEmail('Mode Guest / Tamu');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mekanisme Pemuatan Dinamis Data dari Database Supabase Anda!
  useEffect(() => {
    async function sinkronkanSupabase() {
      setIsLoadingSupabase(true);
      try {
        const dbRes = await fetchAllDataFromSupabase();
        if (dbRes) {
          if (dbRes.locations && dbRes.locations.length > 0) {
            setLocations(dbRes.locations);
          }
          if (dbRes.beneficiaries) {
            setBeneficiaries(dbRes.beneficiaries);
          }
          if (dbRes.nationalTrend && dbRes.nationalTrend.length > 0) {
            setNationalTrend(dbRes.nationalTrend);
          }
        }
      } catch (err) {
        console.error("Gagal menyelesaikan sinkronisasi database:", err);
      } finally {
        setIsLoadingSupabase(false);
      }
    }
    sinkronkanSupabase();
  }, []);

  const [addLocForm, setAddLocForm] = useState({
    preset: '',
    name: '',
    province: '',
    x: 50,
    y: 50,
    workersReached: 0,
    activeLearningCircles: 0,
    circleParticipants: 0,
    championsCount: 0,
    organizationMembers: 0,
    casesCount: 0,
    casesSolved: 0
  });

  const handlePresetChange = (presetName: string) => {
    const port = PRESET_PORTS.find(p => p.name === presetName);
    if (port) {
      setAddLocForm(prev => ({
        ...prev,
        preset: presetName,
        name: port.name,
        province: port.province,
        x: port.x,
        y: port.y
      }));
    } else {
      setAddLocForm(prev => ({ ...prev, preset: '', name: '', province: '' }));
    }
  };

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(mockData.beneficiaries || []);

  // Compute location stats where counts are dynamically computed from spreadsheet if it contains values
  const locationsWithDerivedStats = useMemo(() => {
    return locations.map(loc => {
      const hubBeneficiaries = beneficiaries.filter(b => b.locationId === loc.id);
      
      // Derive combined champions list from original champions and status-eligible beneficiaries
      const beneficiaryChampions: Champion[] = hubBeneficiaries
        .filter(b => b.category === 'Champion')
        .map(b => ({
          name: b.name,
          role: b.notes?.trim() ? (b.notes.length > 35 ? b.notes.substring(0, 35) + '...' : b.notes) : 'Kader Pendamping (Penjangkauan)',
          description: `Kader teridentifikasi dari data Penjangkauan (Asal: ${b.origin || 'Pelabuhan Lokal'}). ${b.notes ? `Catatan: ${b.notes}` : ''}`,
          status: 'Aktif' as const,
          phone: b.phone || ''
        }));

      const combinedChampions = [...loc.champions];
      beneficiaryChampions.forEach(bc => {
        const exists = combinedChampions.some(existing => existing.name.toLowerCase().trim() === bc.name.toLowerCase().trim());
        if (!exists) {
          combinedChampions.push(bc);
        }
      });

      // Default counts or overridden dynamically if beneficiaries list exists
      let finalStats = { ...loc.stats };

      if (hubBeneficiaries.length > 0) {
        const workersReached = hubBeneficiaries.length;
        // Count total champions based on combined list length
        const championsCount = combinedChampions.length;
        
        // Derive circleParticipants & organizationMembers proportional or based on contents
        const circleParticipantsCount = hubBeneficiaries.filter(b => 
          b.category === 'Champion' || 
          b.notes.toLowerCase().includes('belajar') || 
          b.notes.toLowerCase().includes('lingkaran')
        ).length;

        const organizationMembersCount = hubBeneficiaries.filter(b => 
          b.notes.toLowerCase().includes('serikat') || 
          b.notes.toLowerCase().includes('sppi') || 
          b.notes.toLowerCase().includes('anggota')
        ).length;

        const finalCircleParticipants = Math.max(Math.round(workersReached * 0.15) + circleParticipantsCount * 2, circleParticipantsCount);
        const finalOrganizationMembers = Math.max(Math.round(workersReached * 0.35) + organizationMembersCount, organizationMembersCount);

        finalStats = {
          ...loc.stats,
          workersReached: Math.max(loc.stats.workersReached, workersReached),
          championsCount: Math.max(loc.stats.championsCount, championsCount),
          circleParticipants: Math.max(loc.stats.circleParticipants, Math.min(workersReached, finalCircleParticipants)),
          organizationMembers: Math.max(loc.stats.organizationMembers, Math.min(workersReached, finalOrganizationMembers))
        };
      } else {
        // Enforce update to championsCount in stats even if there are no general beneficiaries
        finalStats.championsCount = Math.max(loc.stats.championsCount, combinedChampions.length);
      }

      return {
        ...loc,
        stats: finalStats,
        champions: combinedChampions
      };
    });
  }, [locations, beneficiaries]);

  const handleAddBeneficiary = async (newB: Beneficiary) => {
    setBeneficiaries(prev => [newB, ...prev]);
    if (supabase) {
      try {
        await supabase.from('beneficiaries').upsert({
          id: newB.id,
          location_id: newB.locationId,
          name: newB.name,
          phone: newB.phone || '',
          origin: newB.origin || '',
          age: newB.age || 30,
          category: newB.category || 'Umum',
          notes: newB.notes || ''
        });
      } catch (err) {
        console.error("Gagal simpan penerima manfaat ke Supabase:", err);
      }
    }
  };

  const handleImportBeneficiaries = async (newList: Beneficiary[], overwrite: boolean) => {
    if (overwrite) {
      setBeneficiaries(newList);
      if (supabase) {
        try {
          await supabase.from('beneficiaries').delete().neq('id', 'placeholder-item');
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      setBeneficiaries(prev => [...newList, ...prev]);
    }

    if (supabase) {
      try {
        const payload = newList.map(b => ({
          id: b.id,
          location_id: b.locationId,
          name: b.name,
          phone: b.phone || '',
          origin: b.origin || '',
          age: b.age || 30,
          category: b.category || 'Umum',
          notes: b.notes || ''
        }));
        await supabase.from('beneficiaries').insert(payload);
      } catch (err) {
        console.error("Gagal kirim import penerima manfaat ke Supabase:", err);
      }
    }
  };

  const handleDeleteBeneficiary = async (id: string) => {
    setBeneficiaries(prev => prev.filter(b => b.id !== id));
    if (supabase) {
      try {
        await supabase.from('beneficiaries').delete().eq('id', id);
      } catch (err) {
        console.error("Gagal menghapus penerima manfaat di Supabase:", err);
      }
    }
  };

  const handleUpdateBeneficiary = async (updated: Beneficiary) => {
    setBeneficiaries(prev => prev.map(b => b.id === updated.id ? updated : b));
    if (supabase) {
      try {
        await supabase.from('beneficiaries').upsert({
          id: updated.id,
          location_id: updated.locationId,
          name: updated.name,
          phone: updated.phone || '',
          origin: updated.origin || '',
          age: updated.age || 30,
          category: updated.category || 'Umum',
          notes: updated.notes || ''
        });
      } catch (err) {
        console.error("Gagal mengubah data penerima manfaat di Supabase:", err);
      }
    }
  };
  
  // Location specific tab selection state: 'overview' | 'activism' | 'history'
  const [locationTab, setLocationTab] = useState<'overview' | 'activism' | 'history'>('overview');

  // KPI Edit & Accumulate Modal State
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [kpiModalLocationId, setKpiModalLocationId] = useState<string | null>(null);

  const handleOpenKPIModal = (locId: string | null) => {
    setKpiModalLocationId(locId);
    setIsKPIModalOpen(true);
  };

  const handleSaveKPIStats = async (locationId: string, updatedStats: LocationStats, actionType: 'edit' | 'tambah') => {
    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locationId) return loc;

        const finalStats = { ...loc.stats };
        if (actionType === 'edit') {
          finalStats.workersReached = updatedStats.workersReached;
          finalStats.activeLearningCircles = updatedStats.activeLearningCircles;
          finalStats.circleParticipants = updatedStats.circleParticipants;
          finalStats.championsCount = updatedStats.championsCount;
          finalStats.organizationMembers = updatedStats.organizationMembers;
          finalStats.casesCount = updatedStats.casesCount;
          finalStats.casesSolved = updatedStats.casesSolved;
          finalStats.casesPending = Math.max(0, updatedStats.casesCount - updatedStats.casesSolved);
        } else {
          // Tambah / Akumulasi
          finalStats.workersReached += updatedStats.workersReached;
          finalStats.activeLearningCircles += updatedStats.activeLearningCircles;
          finalStats.circleParticipants += updatedStats.circleParticipants;
          finalStats.championsCount += updatedStats.championsCount;
          finalStats.organizationMembers += updatedStats.organizationMembers;
          finalStats.casesCount += updatedStats.casesCount;
          finalStats.casesSolved += updatedStats.casesSolved;
          finalStats.casesPending = Math.max(0, finalStats.casesCount - finalStats.casesSolved);
        }

        // Tulis manual override KPI ke localStorage agar awet & presisi pasca-refresh di GitHub Pages
        localStorage.setItem(`DFW_LOCAL_KPI_${locationId}`, JSON.stringify(finalStats));

        // Generate nice automated feedback milestone
        const actionText = actionType === 'edit' ? 'Koreksi/pembaharuan' : 'Entri peluruhan kegiatan baru';
        const newTimelineEvent = {
          date: getIndonesianDate(),
          title: `Data KPI Terperbarui`,
          description: `${actionText} berhasil ditransfer: ${
            updatedStats.workersReached > 0 ? `+${updatedStats.workersReached} pekerja, ` : ''
          }${updatedStats.activeLearningCircles > 0 ? `+${updatedStats.activeLearningCircles} lingkaran belajar.` : 'penyesuaian data operasional port.'}`,
          category: 'pencapaian' as const
        };

        if (supabase) {
          supabase.from('timeline_events').insert({
            location_id: locationId,
            date: getIndonesianDate(),
            title: `Data KPI Terperbarui`,
            description: `${actionText} berhasil disinkronkan ke cloud.`,
            category: 'pencapaian'
          }).then();
        }

        return {
          ...loc,
          stats: finalStats,
          timeline: [newTimelineEvent, ...loc.timeline]
        };
      });
    });

    // Mirror updates in national trend for visual symmetry
    if (actionType === 'tambah') {
      setNationalTrend(prevTrend => {
        return prevTrend.map(t => {
          if (t.year !== 2026) return t;
          return {
            ...t,
            workersReached: t.workersReached + updatedStats.workersReached,
            learningCircles: t.learningCircles + updatedStats.activeLearningCircles,
            casesHandled: t.casesHandled + updatedStats.casesCount,
            casesSolved: t.casesSolved + updatedStats.casesSolved
          };
        });
      });
    }
  };

  // Compute list of locations name/id for simulation selectors
  const locationsList = useMemo(() => {
    return locationsWithDerivedStats.map(loc => ({ id: loc.id, name: loc.name }));
  }, [locationsWithDerivedStats]);

  // Extract all unique issue categories across data for the simulator list
  const issueCategories = useMemo(() => {
    return Object.values(mockData.issueTaxonomyLabels);
  }, []);

  // Compute aggregated national statistics
  const nationalStats = useMemo<LocationStats>(() => {
    return locationsWithDerivedStats.reduce<LocationStats>((acc, cur) => {
      // Adjust metrics slightly based on yearFilter for realistic simulation
      const scale = yearFilter === 2026 ? 1.0 : yearFilter === 2025 ? 0.85 : yearFilter === 2024 ? 0.72 : yearFilter === 2023 ? 0.55 : 0.4;
      
      return {
        workersReached: acc.workersReached + Math.round(cur.stats.workersReached * scale),
        activeLearningCircles: acc.activeLearningCircles + Math.round(cur.stats.activeLearningCircles * scale),
        circleParticipants: acc.circleParticipants + Math.round(cur.stats.circleParticipants * scale),
        championsCount: acc.championsCount + Math.round(cur.stats.championsCount * scale),
        organizationMembers: acc.organizationMembers + Math.round(cur.stats.organizationMembers * scale),
        casesCount: acc.casesCount + Math.round(cur.stats.casesCount * scale),
        casesSolved: acc.casesSolved + Math.round(cur.stats.casesSolved * scale),
        casesPending: acc.casesPending + Math.round(cur.stats.casesPending * scale),
      };
    }, {
      workersReached: 0,
      activeLearningCircles: 0,
      circleParticipants: 0,
      championsCount: 0,
      organizationMembers: 0,
      casesCount: 0,
      casesSolved: 0,
      casesPending: 0
    });
  }, [locationsWithDerivedStats, yearFilter]);

  // Compute aggregated issue statistics for the National distribution chart
  const nationalIssueCategories = useMemo<IssueCategory[]>(() => {
    const counts: { [key: string]: { count: number; severity: 'Tinggi' | 'Sedang' | 'Rendah' } } = {};
    
    locationsWithDerivedStats.forEach(loc => {
      // Scale count based on active year filter context
      const scale = yearFilter === 2026 ? 1.0 : yearFilter === 2025 ? 0.8 : yearFilter === 2024 ? 0.6 : 0.4;
      
      loc.issueCategories.forEach(issue => {
        const scaledCount = Math.max(1, Math.round(issue.count * scale));
        if (counts[issue.category]) {
          counts[issue.category].count += scaledCount;
        } else {
          counts[issue.category] = { count: scaledCount, severity: issue.severity };
        }
      });
    });

    return Object.entries(counts).map(([category, info]) => ({
      category,
      count: info.count,
      severity: info.severity
    }));
  }, [locationsWithDerivedStats, yearFilter]);

  // Prepare filtered stats specific to the selected location
  const activeLocation = useMemo<LocationData | null>(() => {
    if (!selectedLocationId) return null;
    const loc = locationsWithDerivedStats.find(l => l.id === selectedLocationId);
    if (!loc) return null;

    // Apply scaling for mock temporal views
    if (yearFilter !== 2026) {
      const scale = yearFilter === 2025 ? 0.85 : yearFilter === 2024 ? 0.72 : yearFilter === 2023 ? 0.55 : 0.4;
      const originalCases = Math.max(1, Math.round(loc.stats.casesCount * scale));
      const originalSolved = Math.max(1, Math.round(loc.stats.casesSolved * scale));
      
      return {
        ...loc,
        stats: {
          workersReached: Math.round(loc.stats.workersReached * scale),
          activeLearningCircles: Math.max(1, Math.round(loc.stats.activeLearningCircles * scale)),
          circleParticipants: Math.round(loc.stats.circleParticipants * scale),
          championsCount: Math.max(1, Math.round(loc.stats.championsCount * scale)),
          organizationMembers: Math.round(loc.stats.organizationMembers * scale),
          casesCount: originalCases,
          casesSolved: originalSolved,
          casesPending: Math.max(0, originalCases - originalSolved)
        }
      };
    }
    return loc;
  }, [selectedLocationId, locationsWithDerivedStats, yearFilter]);

  // Merge all cases for a comprehensive combined table on the National Dashboard
  const nationalCases = useMemo<Case[]>(() => {
    let list: Case[] = [];
    locationsWithDerivedStats.forEach(loc => {
      // Append hub origin label to case reporters
      const prefixedCases = loc.cases.map(c => ({
        ...c,
        locationId: loc.id,
        locationName: loc.name,
        reporter: `${c.reporter} (${loc.name})`
      }));
      list = [...list, ...prefixedCases];
    });

    // Handle chronological sort (recent first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [locationsWithDerivedStats]);

  // Merge all reflections for a comprehensive combined list on the National Dashboard
  const nationalReflections = useMemo(() => {
    let list: (Reflection & { locationId: string; locationName: string })[] = [];
    locationsWithDerivedStats.forEach(loc => {
      const currentReflections = loc.reflections || [];
      const prefixedReflections = currentReflections.map(r => ({
        ...r,
        locationId: loc.id,
        locationName: loc.name
      }));
      list = [...list, ...prefixedReflections];
    });

    // Handle chronological sort (recent first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [locationsWithDerivedStats]);

  // Case update & deletion pipelines
  const handleUpdateCase = async (locId: string, updatedCase: Case) => {
    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;

        const oldCase = loc.cases.find(c => c.id === updatedCase.id);
        let solvedDelta = 0;
        let pendingDelta = 0;

        if (oldCase) {
          if (oldCase.status !== 'Selesai' && updatedCase.status === 'Selesai') {
            solvedDelta = 1;
            pendingDelta = -1;
          } else if (oldCase.status === 'Selesai' && updatedCase.status !== 'Selesai') {
            solvedDelta = -1;
            pendingDelta = 1;
          }
        }

        const updatedCases = loc.cases.map(c => c.id === updatedCase.id ? updatedCase : c);

        return {
          ...loc,
          stats: {
            ...loc.stats,
            casesSolved: Math.max(0, loc.stats.casesSolved + solvedDelta),
            casesPending: Math.max(0, loc.stats.casesPending + pendingDelta)
          },
          cases: updatedCases
        };
      });
    });

    if (supabase) {
      try {
        await supabase.from('cases').upsert({
          id: updatedCase.id,
          location_id: locId,
          title: updatedCase.title,
          category: updatedCase.category,
          status: updatedCase.status,
          date: updatedCase.date,
          description: updatedCase.description,
          reporter: updatedCase.reporter,
          impact_level: updatedCase.impact_level
        });

        // Sinkronisasi data catatan perkembangan (progressNotes / case_progress_notes) ke Supabase
        await supabase.from('case_progress_notes').delete().eq('case_id', updatedCase.id);
        
        if (updatedCase.progressNotes && updatedCase.progressNotes.length > 0) {
          const payload = updatedCase.progressNotes.map(n => ({
            case_id: updatedCase.id,
            date: n.date,
            note: n.note,
            author: n.author || 'Petugas Posko'
          }));
          await supabase.from('case_progress_notes').insert(payload);
        }
      } catch (err) {
        console.error("Gagal memperbarui kasus beserta catatan perkembangannya di Supabase:", err);
      }
    }
  };

  const handleDeleteCase = async (locId: string, caseId: string) => {
    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;

        const oldCase = loc.cases.find(c => c.id === caseId);
        if (!oldCase) return loc;

        const solvedDelta = oldCase.status === 'Selesai' ? -1 : 0;
        const pendingDelta = oldCase.status !== 'Selesai' ? -1 : 0;
        const updatedCases = loc.cases.filter(c => c.id !== caseId);

        return {
          ...loc,
          stats: {
            ...loc.stats,
            casesCount: Math.max(0, loc.stats.casesCount - 1),
            casesSolved: Math.max(0, loc.stats.casesSolved + solvedDelta),
            casesPending: Math.max(0, loc.stats.casesPending + pendingDelta)
          },
          cases: updatedCases
        };
      });
    });

    if (supabase) {
      try {
        await supabase.from('cases').delete().eq('id', caseId);
      } catch (err) {
        console.error("Gagal menghapus kasus dari Supabase:", err);
      }
    }
  };

  // Simulated Case update pipeline
  const handleAddCase = async (locId: string, caseData: Omit<Case, 'id' | 'date'>) => {
    // Generate serial ID code
    const codePrefix = locId === 'muara-baru' ? 'MB' : locId === 'benoa' ? 'BA' : 'BT';
    
    // Temukan info instansi pelabuhan saat ini untuk hitung serial ID
    const currentLoc = locations.find(l => l.id === locId);
    const nextIdNumber = (currentLoc?.cases.length || 0) + 22;
    const newCode = `${codePrefix}-${String(nextIdNumber).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newCase: Case = {
      id: newCode,
      title: caseData.title,
      category: caseData.category,
      status: 'Baru',
      date: todayStr,
      description: caseData.description,
      reporter: caseData.reporter,
      impact_level: caseData.impact_level
    };

    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;

        // Prepend to cases array
        const updatedCases = [newCase, ...loc.cases];

        // Increase relevant statistics
        const updatedStats = {
          ...loc.stats,
          casesCount: loc.stats.casesCount + 1,
          casesPending: loc.stats.casesPending + 1,
          workersReached: loc.stats.workersReached + 15, // new outreach during intake
        };

        // Prepend to timeline milestones
        const newTimelineEvent = {
          date: getIndonesianDate(),
          title: `Laporan Lapor Kasus #${newCode}`,
          description: `${caseData.title}. Dilaporkan oleh ${caseData.reporter}.`,
          category: 'kasus' as const
        };
        const updatedTimeline = [newTimelineEvent, ...loc.timeline];

        // Increment issue categories count index
        const updatedIssueCategories = [...loc.issueCategories];
        const categoryIndex = updatedIssueCategories.findIndex(i => i.category === caseData.category);
        if (categoryIndex !== -1) {
          updatedIssueCategories[categoryIndex] = {
            ...updatedIssueCategories[categoryIndex],
            count: updatedIssueCategories[categoryIndex].count + 1
          };
        } else {
          updatedIssueCategories.push({
            category: caseData.category,
            count: 1,
            severity: caseData.impact_level as 'Tinggi' | 'Sedang' | 'Rendah'
          });
        }

        return {
          ...loc,
          stats: updatedStats,
          cases: updatedCases,
          timeline: updatedTimeline,
          issueCategories: updatedIssueCategories
        };
      });
    });

    if (supabase) {
      try {
        await supabase.from('cases').insert({
          id: newCode,
          location_id: locId,
          title: caseData.title,
          category: caseData.category,
          status: 'Baru',
          date: todayStr,
          description: caseData.description,
          reporter: caseData.reporter,
          impact_level: caseData.impact_level
        });

        await supabase.from('timeline_events').insert({
          location_id: locId,
          date: getIndonesianDate(),
          title: `Laporan Lapor Kasus #${newCode}`,
          description: `${caseData.title}. Dilaporkan oleh ${caseData.reporter}.`,
          category: 'kasus'
        });
      } catch (err) {
        console.error("Gagal menambahkan kasus ke Supabase:", err);
      }
    }

    // Update temporal trend database stats for year 2026
    setNationalTrend(prevTrend => {
      return prevTrend.map(t => {
        if (t.year !== 2026) return t;
        return {
          ...t,
          workersReached: t.workersReached + 15,
          casesHandled: t.casesHandled + 1
        };
      });
    });
  };

  // Reflections CRUD Pipelines
  const handleAddReflection = async (locId: string, reflectionData: Omit<Reflection, 'id' | 'date'>) => {
    const codePrefix = locId === 'muara-baru' ? 'MB' : locId === 'benoa' ? 'BA' : 'BT';
    const currentLoc = locations.find(l => l.id === locId);
    const nextIdNumber = ((currentLoc?.reflections || []).length) + 1;
    const newCode = `REF-${codePrefix}-${String(nextIdNumber).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newReflection: Reflection = {
      id: newCode,
      title: reflectionData.title,
      category: reflectionData.category,
      date: todayStr,
      content: reflectionData.content,
      author: reflectionData.author
    };

    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        const currentReflections = loc.reflections || [];

        return {
          ...loc,
          reflections: [newReflection, ...currentReflections]
        };
      });
    });

    if (supabase) {
      try {
        await supabase.from('reflections').insert({
          id: newCode,
          location_id: locId,
          title: reflectionData.title,
          date: todayStr,
          category: reflectionData.category,
          content: reflectionData.content,
          author: reflectionData.author
        });
      } catch (err) {
        console.error("Gagal menambahkan refleksi ke Supabase:", err);
      }
    }
  };

  const handleUpdateReflection = async (locId: string, refId: string, updatedRef: Reflection) => {
    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        const currentReflections = loc.reflections || [];
        const updatedReflections = currentReflections.map(r => r.id === refId ? updatedRef : r);
        return {
          ...loc,
          reflections: updatedReflections
        };
      });
    });

    if (supabase) {
      try {
        await supabase.from('reflections').upsert({
          id: updatedRef.id,
          location_id: locId,
          title: updatedRef.title,
          date: updatedRef.date,
          category: updatedRef.category,
          content: updatedRef.content,
          author: updatedRef.author
        });
      } catch (err) {
        console.error("Gagal memperbarui refleksi di Supabase:", err);
      }
    }
  };

  const handleDeleteReflection = async (locId: string, refId: string) => {
    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        const currentReflections = loc.reflections || [];
        const updatedReflections = currentReflections.filter(r => r.id !== refId);
        return {
          ...loc,
          reflections: updatedReflections
        };
      });
    });

    if (supabase) {
      try {
        await supabase.from('reflections').delete().eq('id', refId);
      } catch (err) {
        console.error("Gagal menghapus refleksi dari Supabase:", err);
      }
    }
  };

  // Champions CRUD Pipelines
  const handleAddChampion = async (locId: string, champ: Champion) => {
    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        return {
          ...loc,
          champions: [...loc.champions, champ],
          stats: {
            ...loc.stats,
            championsCount: loc.stats.championsCount + 1
          }
        };
      });
    });

    if (supabase) {
      try {
        await supabase.from('champions').insert({
          location_id: locId,
          name: champ.name,
          role: champ.role,
          description: champ.description || '',
          status: champ.status || 'Aktif',
          phone: champ.phone || ''
        });
      } catch (err) {
        console.error("Gagal menambahkan kader ke Supabase:", err);
      }
    }
  };

  const handleUpdateChampion = async (locId: string, index: number, updatedChamp: Champion) => {
    const currentLoc = locations.find(l => l.id === locId);
    const oldChampName = currentLoc?.champions[index]?.name;

    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        const updatedChampions = loc.champions.map((c, i) => i === index ? updatedChamp : c);
        return {
          ...loc,
          champions: updatedChampions
        };
      });
    });

    if (supabase && oldChampName) {
      try {
        await supabase.from('champions').update({
          name: updatedChamp.name,
          role: updatedChamp.role,
          description: updatedChamp.description || '',
          status: updatedChamp.status || 'Aktif',
          phone: updatedChamp.phone || ''
        }).match({ location_id: locId, name: oldChampName });
      } catch (err) {
        console.error("Gagal memperbarui kader di Supabase:", err);
      }
    }
  };

  const handleDeleteChampion = async (locId: string, index: number) => {
    const currentLoc = locations.find(l => l.id === locId);
    const oldChampName = currentLoc?.champions[index]?.name;

    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        const updatedChampions = loc.champions.filter((_, i) => i !== index);
        return {
          ...loc,
          champions: updatedChampions,
          stats: {
            ...loc.stats,
            championsCount: Math.max(0, loc.stats.championsCount - 1)
          }
        };
      });
    });

    if (supabase && oldChampName) {
      try {
        await supabase.from('champions').delete().match({ location_id: locId, name: oldChampName });
      } catch (err) {
        console.error("Gagal menghapus kader dari Supabase:", err);
      }
    }
  };

  // Organizations CRUD Pipelines
  const handleAddOrganization = async (locId: string, org: WorkerOrganization) => {
    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        return {
          ...loc,
          organizations: [...loc.organizations, org],
          stats: {
            ...loc.stats,
            organizationMembers: loc.stats.organizationMembers + org.members
          }
        };
      });
    });

    if (supabase) {
      try {
        const { error } = await supabase.from('organizations').insert({
          location_id: locId,
          name: org.name,
          type: org.type,
          established: org.established,
          members: org.members
        });

        if (error) {
          console.error("Gagal menambahkan organisasi ke Supabase:", error);
          alert("Gagal menambahkan data organisasi ke Supabase: " + error.message);
        } else {
          console.log("Organisasi berhasil ditambahkan ke Supabase.");
        }
      } catch (err: any) {
        console.error("Exception saat menambahkan organisasi:", err);
      }
    }
  };

  const handleUpdateOrganization = async (locId: string, index: number, updatedOrg: WorkerOrganization) => {
    const currentLoc = locations.find(l => l.id === locId);
    const oldOrgName = currentLoc?.organizations[index]?.name;

    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        const oldMembers = loc.organizations[index]?.members || 0;
        const updatedOrgs = loc.organizations.map((o, i) => i === index ? updatedOrg : o);
        return {
          ...loc,
          organizations: updatedOrgs,
          stats: {
            ...loc.stats,
            organizationMembers: Math.max(0, loc.stats.organizationMembers - oldMembers + updatedOrg.members)
          }
        };
      });
    });

    if (supabase && oldOrgName) {
      try {
        const { error } = await supabase.from('organizations').update({
          name: updatedOrg.name,
          type: updatedOrg.type,
          established: updatedOrg.established,
          members: updatedOrg.members
        }).match({ location_id: locId, name: oldOrgName });

        if (error) {
          console.error("Gagal memperbarui organisasi di Supabase:", error);
          alert("Gagal memperbarui data organisasi di Supabase: " + error.message);
        } else {
          console.log("Organisasi berhasil diperbarui di Supabase.");
        }
      } catch (err: any) {
        console.error("Exception saat memperbarui organisasi:", err);
      }
    }
  };

  const handleDeleteOrganization = async (locId: string, index: number) => {
    const currentLoc = locations.find(l => l.id === locId);
    const oldOrgName = currentLoc?.organizations[index]?.name;

    setLocations(prevLocations => {
      return prevLocations.map(loc => {
        if (loc.id !== locId) return loc;
        const oldMembers = loc.organizations[index]?.members || 0;
        const updatedOrgs = loc.organizations.filter((_, i) => i !== index);
        return {
          ...loc,
          organizations: updatedOrgs,
          stats: {
            ...loc.stats,
            organizationMembers: Math.max(0, loc.stats.organizationMembers - oldMembers)
          }
        };
      });
    });

    if (supabase && oldOrgName) {
      try {
        const { error } = await supabase.from('organizations').delete().match({ location_id: locId, name: oldOrgName });
        if (error) {
          console.error("Gagal menghapus organisasi dari Supabase:", error);
          alert("Gagal menghapus organisasi dari Supabase: " + error.message);
        } else {
          console.log("Organisasi berhasil dihapus dari Supabase.");
        }
      } catch (err: any) {
        console.error("Exception saat menghapus organisasi:", err);
      }
    }
  };

  const handleLoginToggle = async () => {
    if (isLoggedIn) {
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error("Gagal signOut dari Supabase:", err);
        }
      }
      setIsLoggedIn(false);
      setCurrentUserEmail('Mode Guest / Tamu');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const closeAddLocationModal = () => {
    setIsAddLocationModalOpen(false);
    setEditingLocationId(null);
    setAddLocForm({
      preset: '',
      name: '',
      province: '',
      x: 50,
      y: 50,
      workersReached: 0,
      activeLearningCircles: 0,
      circleParticipants: 0,
      championsCount: 0,
      organizationMembers: 0,
      casesCount: 0,
      casesSolved: 0
    });
  };

  const startEditLocation = (loc: LocationData) => {
    setEditingLocationId(loc.id);
    setAddLocForm({
      preset: '',
      name: loc.name,
      province: loc.province,
      x: loc.coordinates?.x ?? 50,
      y: loc.coordinates?.y ?? 50,
      workersReached: loc.stats.workersReached,
      activeLearningCircles: loc.stats.activeLearningCircles,
      circleParticipants: loc.stats.circleParticipants,
      championsCount: loc.stats.championsCount,
      organizationMembers: loc.stats.organizationMembers,
      casesCount: loc.stats.casesCount,
      casesSolved: loc.stats.casesSolved
    });
    setIsAddLocationModalOpen(true);
  };

  const handleDeleteLocation = async (locId: string) => {
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;

    if (!window.confirm(`Apakah Anda yakin ingin menghapus wilayah "${loc.name}"? Semua data kasus, kader, serikat, dan capaian di wilayah ini akan dihapus secara permanen.`)) {
      return;
    }

    setLocations(prev => prev.filter(l => l.id !== locId));
    setSelectedLocationId(null);

    if (supabase) {
      try {
        await supabase.from('locations').delete().eq('id', locId);
      } catch (err) {
        console.error("Gagal menghapus lokasi dari Supabase:", err);
      }
    }
  };

  const handleAddNewLocation = async () => {
    if (!addLocForm.name.trim()) {
      alert("Silakan masukkan nama Pelabuhan/Hub!");
      return;
    }
    if (!addLocForm.province.trim()) {
      alert("Silakan masukkan nama Provinsi!");
      return;
    }

    if (editingLocationId) {
      // Editing mode
      setLocations(prev => prev.map(loc => {
        if (loc.id === editingLocationId) {
          return {
            ...loc,
            name: addLocForm.name,
            province: addLocForm.province,
            coordinates: { x: Number(addLocForm.x), y: Number(addLocForm.y) },
            stats: {
              ...loc.stats,
              workersReached: Number(addLocForm.workersReached) || 0,
              activeLearningCircles: Number(addLocForm.activeLearningCircles) || 0,
              circleParticipants: Number(addLocForm.circleParticipants) || 0,
              championsCount: Number(addLocForm.championsCount) || 0,
              organizationMembers: Number(addLocForm.organizationMembers) || 0,
              casesCount: Number(addLocForm.casesCount) || 0,
              casesSolved: Number(addLocForm.casesSolved) || 0,
              casesPending: Math.max(0, (Number(addLocForm.casesCount) || 0) - (Number(addLocForm.casesSolved) || 0))
            }
          };
        }
        return loc;
      }));

      setIsAddLocationModalOpen(false);

      if (supabase) {
        try {
          await supabase.from('locations').update({
            name: addLocForm.name,
            province: addLocForm.province,
            coordinate_x: Number(addLocForm.x),
            coordinate_y: Number(addLocForm.y)
          }).eq('id', editingLocationId);
        } catch (err) {
          console.error("Gagal memperbarui lokasi di Supabase:", err);
        }
      }

      setEditingLocationId(null);
      
      // Reset Form
      setAddLocForm({
        preset: '',
        name: '',
        province: '',
        x: 50,
        y: 50,
        workersReached: 120,
        activeLearningCircles: 2,
        circleParticipants: 24,
        championsCount: 2,
        organizationMembers: 45,
        casesCount: 2,
        casesSolved: 1
      });
      return;
    }

    const slugId = addLocForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    
    // Check if ID already exists
    if (locations.some(loc => loc.id === slugId)) {
      alert(`Wilayah Hub "${addLocForm.name}" sudah terdaftar! Gunakan nama yang berbeda.`);
      return;
    }

    const newLoc: LocationData = {
      id: slugId,
      name: addLocForm.name,
      province: addLocForm.province,
      coordinates: { x: Number(addLocForm.x), y: Number(addLocForm.y) },
      stats: {
        workersReached: Number(addLocForm.workersReached) || 0,
        activeLearningCircles: Number(addLocForm.activeLearningCircles) || 0,
        circleParticipants: Number(addLocForm.circleParticipants) || 0,
        championsCount: Number(addLocForm.championsCount) || 0,
        organizationMembers: Number(addLocForm.organizationMembers) || 0,
        casesCount: Number(addLocForm.casesCount) || 0,
        casesSolved: Number(addLocForm.casesSolved) || 0,
        casesPending: Math.max(0, (Number(addLocForm.casesCount) || 0) - (Number(addLocForm.casesSolved) || 0))
      },
      organizations: [],
      champions: [],
      issueCategories: [
        { category: "Pelanggaran Hak Ketenagakerjaan", count: addLocForm.casesCount > 0 ? Math.ceil(addLocForm.casesCount * 0.4) : 0, severity: "Tinggi" },
        { category: "Jam Kerja Berlebih", count: addLocForm.casesCount > 0 ? Math.floor(addLocForm.casesCount * 0.3) : 0, severity: "Tinggi" },
        { category: "Gaji Tidak Dibayar", count: addLocForm.casesCount > 0 ? Math.floor(addLocForm.casesCount * 0.3) : 0, severity: "Tinggi" },
        { category: "Perlindungan Sosial", count: 0, severity: "Sedang" },
        { category: "Masalah Perekrutan", count: 0, severity: "Sedang" }
      ],
      cases: [],
      reflections: [],
      timeline: [
        {
          date: getIndonesianDate(),
          title: "Inisiasi Hub Posko Baru",
          description: `Pembentukan posko pengaduan bersama dan pemantauan hak asasi awak kapal perikanan di pelabuhan ${addLocForm.name}, ${addLocForm.province}.`,
          category: "organisasi"
        }
      ]
    };

    setLocations(prev => [...prev, newLoc]);
    setIsAddLocationModalOpen(false);

    if (supabase) {
      try {
        await supabase.from('locations').insert({
          id: slugId,
          name: addLocForm.name,
          province: addLocForm.province,
          coordinate_x: Number(addLocForm.x),
          coordinate_y: Number(addLocForm.y)
        });

        await supabase.from('timeline_events').insert({
          location_id: slugId,
          date: getIndonesianDate(),
          title: "Inisiasi Hub Posko Baru",
          description: `Pembentukan posko pengaduan bersama dan pemantauan hak asasi awak kapal perikanan di pelabuhan ${addLocForm.name}, ${addLocForm.province}.`,
          category: "organisasi"
        });
      } catch (err) {
        console.error("Gagal menambahkan lokasi ke Supabase:", err);
      }
    }

    // Reset Form
    setAddLocForm({
      preset: '',
      name: '',
      province: '',
      x: 50,
      y: 50,
      workersReached: 120,
      activeLearningCircles: 2,
      circleParticipants: 24,
      championsCount: 2,
      organizationMembers: 45,
      casesCount: 2,
      casesSolved: 1
    });

    // Navigate to see the newly created hub detail view!
    setSelectedLocationId(slugId);
  };

  return (
    <AdminShell
      activeTab={selectedLocationId || 'nasional'}
      onActiveTabChange={(id) => setSelectedLocationId(id === 'nasional' ? null : id)}
      userEmail={currentUserEmail}
      yearFilter={yearFilter}
      onYearFilterChange={(year) => setYearFilter(year)}
      locations={locationsWithDerivedStats}
      onOpenAddLocation={() => setIsAddLocationModalOpen(true)}
      isLoggedIn={isLoggedIn}
      onLoginToggle={handleLoginToggle}
      onChangePassword={() => setIsChangePasswordOpen(true)}
    >
      
      {/* Supabase Status Loading Alert Banner */}
      {isLoadingSupabase && (
        <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl p-4 text-xs font-sans flex items-center justify-between shadow-xs mb-3 animate-pulse" id="database-loading-alert">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
            <span className="font-semibold text-emerald-800">Menghubungkan & Membaca Data Terkini dari Supabase Cloud...</span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
            Sinkronisasi Aktif
          </span>
        </div>
      )}

      {/* 2026 Year Warning Alert in top of App */}
      {yearFilter !== 2026 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs font-sans flex items-center gap-2.5 shadow-xs" id="temporal-filter-alert">
          <ListFilter className="w-5 h-5 text-amber-600 animate-bounce" />
          <div>
            <strong className="block font-bold text-slate-900 mb-0.5">Filter Data Historis Aktif ({yearFilter})</strong>
            Data ringkasan grafis dan KPI di bawah ini adalah estimasi representatif tingkat kemitraan, jumlah kader, dan sengketa kapal pada tahun {yearFilter}. Beberapa fitur interaktif telah disesuaikan dengan kurva kemajuan.
          </div>
        </div>
      )}

      {/* DASHBOARD ROUTER WORKSPACE */}
      {selectedLocationId === 'penerima-manfaat' ? (
        <BeneficiariesList
          beneficiaries={beneficiaries}
          locations={locationsWithDerivedStats}
          onAddBeneficiary={handleAddBeneficiary}
          onImportBeneficiaries={handleImportBeneficiaries}
          onDeleteBeneficiary={handleDeleteBeneficiary}
          onUpdateBeneficiary={handleUpdateBeneficiary}
          isSuperAdmin={isLoggedIn}
        />
      ) : !selectedLocationId ? (
        
        // ================= NATIONAL VIEW =================
        <div className="space-y-6" id="national-dashboard-view">
          
          {/* Full-width cohesive Header banner (aligned with the Tabler admin theme) */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5 max-w-2xl z-10">
              <span className="text-[9px] bg-blue-500/30 text-blue-200 px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">
                Sistem Pusat Informasi & Pemantauan Hak ABK
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight text-white mt-1">
                Kondisi Awak Kapal & Kemajuan Pengorganisasian
              </h2>
              <p className="text-slate-300 text-xs md:text-sm font-sans leading-relaxed">
                Pusat data advokasi hak asasi nelayan kapal perikanan nasional, didukung oleh jaringan Posko Bersama Destinasi Perikanan Utama Indonesia: Muara Baru (Jakarta), Benoa (Bali), dan Bitung (Sulawesi Utara).
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2.5 z-10 shrink-0">
              <div className="bg-white/5 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-center min-w-[100px]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">Tingkat Solusi</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {Math.round((nationalStats.casesSolved / (nationalStats.casesCount || 1)) * 100)}%
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-center min-w-[100px]">
                <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">Suku Belajar</span>
                <span className="text-lg font-bold text-amber-400 font-mono">{nationalStats.activeLearningCircles} Hub</span>
              </div>
            </div>
            
            {/* Ambient visual background highlights */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none rounded-r-2xl" />
          </div>

          {/* Aggregated KPI Cards with edit capacity */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ringkasan Capaian Jaringan Nasional
            </h3>
            {yearFilter === 2026 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleOpenKPIModal(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 hover:border-blue-300 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  Kelola & Tambah KPI Hub
                </button>
                
                {isLoggedIn && (
                  <button
                    onClick={() => setIsAddLocationModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Lokasi Baru
                  </button>
                )}
              </div>
            )}
          </div>
          <KPICards stats={nationalStats} isNational={true} />

          {/* Core Geographical Map Module & Trend Charts */}
          <div className="grid grid-cols-1 gap-6">
            <IndonesiaMap
              locations={locationsWithDerivedStats}
              selectedLocationId={selectedLocationId}
              onSelectLocation={(id) => {
                setSelectedLocationId(id);
                setLocationTab('overview');
              }}
            />
          </div>

          {/* Secondary Charts Block */}
          <Charts issueData={nationalIssueCategories} trendData={nationalTrend} titlePrefix="Nasional" />

          {/* Interactive Simulation Dashboard */}
          {yearFilter === 2026 && (
            <SimulationPanel
              onAddCase={handleAddCase}
              locationsList={locationsList}
              issueCategories={issueCategories}
              onOpenAddReflection={() => {
                // If on national tab, select the first location so there's an active context to append the reflection to!
                if (!selectedLocationId && locations.length > 0) {
                  setSelectedLocationId(locations[0].id);
                }
                setForceAddReflection(true);
              }}
            />
          )}

          {/* Database Refleksi & Pembelajaran Jaringan Nasional */}
          <NationalReflectionsList
            reflections={nationalReflections}
            onAddReflection={(locId, newRef) => handleAddReflection(locId, newRef)}
            onUpdateReflection={(locId, refId, updated) => handleUpdateReflection(locId, refId, updated)}
            onDeleteReflection={(locId, refId) => handleDeleteReflection(locId, refId)}
            locationsList={locationsList}
            onSelectLocation={(id) => {
              setSelectedLocationId(id);
              setLocationTab('overview');
            }}
            isSuperAdmin={isLoggedIn}
          />

          {/* Combined National Case Documents */}
          <div className="grid grid-cols-1">
            <CasesList
              cases={nationalCases}
              onUpdateCase={handleUpdateCase}
              onDeleteCase={handleDeleteCase}
              isSuperAdmin={isLoggedIn}
              onSelectCase={(c) => {
                // Find and redirect to the location context of this case
                const ownerLoc = locations.find(loc => loc.cases.some(caseItem => caseItem.id === c.id));
                if (ownerLoc) {
                  setSelectedLocationId(ownerLoc.id);
                  setLocationTab('overview');
                }
              }}
            />
          </div>
          
        </div>
      ) : (
        
        // ================= LOCATION DETAIL VIEW =================
        <div className="space-y-6" id="location-detail-view">
          
          {/* Breadcrumb Locator header */}
          <button
            onClick={() => setSelectedLocationId(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 group transition-colors px-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Ringkasan Dashboard Nasional
          </button>

          {/* Cohesive Hub-Specific Header Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider font-mono">
                  Detail Wilayah Jaringan Kerja:
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight text-slate-900 mt-1">
                Pelabuhan Perikanan {activeLocation?.name}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-sans mt-0.5">
                Provinsi {activeLocation?.province} &bull; Pengelolaan kasus lapangan dan koordinasi serikat mitra pelaut perikanan.
              </p>
            </div>

            {/* Quick stats & Admin actions on the right side */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 border border-blue-100 text-blue-700">
                Hub ID: {activeLocation?.id.toUpperCase()}
              </span>
              <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600">
                {activeLocation?.stats.activeLearningCircles} Kelompok Belajar
              </span>

              {/* Admin actions to edit or delete the entire location */}
              {isLoggedIn && activeLocation && (
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 ml-1.5">
                  <button
                    onClick={() => startEditLocation(activeLocation)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition-all cursor-pointer shadow-xs"
                    title="Sunting Detail Wilayah"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Hub
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(activeLocation.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-lg transition-all cursor-pointer shadow-xs"
                    title="Hapus Wilayah Ini Permanen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Hub
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hub-Specific KPI metrics cards with edit capacity */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Indikator Capaian Utama ({activeLocation?.name})
            </h3>
            {yearFilter === 2026 && (
              <button
                onClick={() => handleOpenKPIModal(activeLocation?.id || null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 hover:border-blue-300 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Kelola & Tambah KPI Hub
              </button>
            )}
          </div>
          {activeLocation && <KPICards stats={activeLocation.stats} isNational={false} />}

          {/* Custom Navigation Tab Headers */}
          <div className="border-b border-slate-200 flex items-center gap-2 md:gap-4 overflow-x-auto pb-0.5">
            <button
              onClick={() => setLocationTab('overview')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                locationTab === 'overview'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Kelola Kasus & Sebaran Isu
            </button>
            <button
              onClick={() => setLocationTab('activism')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                locationTab === 'activism'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Kader (Champions) & Serikat Mitra ({activeLocation?.champions.length || 0})
            </button>
            <button
              onClick={() => setLocationTab('history')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                locationTab === 'history'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              Linimasa Kegiatan & Advokasi
            </button>
          </div>

          {/* HUB-SPECIFIC WORKSPACE ROUTER */}
          {activeLocation && (
            <div className="space-y-6">
              
              {locationTab === 'overview' && (
                <>
                  {/* Issue Breakdown Chart for specific Location */}
                  <Charts
                    issueData={activeLocation.issueCategories}
                    trendData={nationalTrend}
                    titlePrefix={activeLocation.name}
                  />

                  {/* Simulator for specific Location Context */}
                  {yearFilter === 2026 && (
                    <SimulationPanel
                      onAddCase={handleAddCase}
                      locationsList={[{ id: activeLocation.id, name: activeLocation.name }]}
                      issueCategories={issueCategories}
                      onOpenAddReflection={() => setForceAddReflection(true)}
                    />
                  )}

                  {/* 50/50 Split Grid: Documentation & Case Register & Reflections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Local Case documents directory list table */}
                    <CasesList
                      cases={activeLocation.cases}
                      onUpdateCase={handleUpdateCase}
                      onDeleteCase={handleDeleteCase}
                      defaultLocationId={activeLocation.id}
                      isSuperAdmin={isLoggedIn}
                    />

                    {/* Reflections & Learnings */}
                    <ReflectionsList
                      reflections={activeLocation.reflections || []}
                      onAddReflection={(newRef) => handleAddReflection(activeLocation.id, newRef)}
                      onUpdateReflection={(refId, updated) => handleUpdateReflection(activeLocation.id, refId, updated)}
                      onDeleteReflection={(refId) => handleDeleteReflection(activeLocation.id, refId)}
                      forceOpenAddModal={forceAddReflection}
                      onResetForceAdd={() => setForceAddReflection(false)}
                      isSuperAdmin={isLoggedIn}
                    />
                  </div>
                </>
              )}

              {locationTab === 'activism' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Champions cadre board list */}
                  <ChampionsList
                    champions={activeLocation.champions}
                    onAddChampion={(champ) => handleAddChampion(activeLocation.id, champ)}
                    onUpdateChampion={(idx, champ) => handleUpdateChampion(activeLocation.id, idx, champ)}
                    onDeleteChampion={(idx) => handleDeleteChampion(activeLocation.id, idx)}
                    isSuperAdmin={isLoggedIn}
                  />

                  {/* Local supporting worker unions list */}
                  <OrganizationsList
                    organizations={activeLocation.organizations}
                    onAddOrganization={(org) => handleAddOrganization(activeLocation.id, org)}
                    onUpdateOrganization={(idx, org) => handleUpdateOrganization(activeLocation.id, idx, org)}
                    onDeleteOrganization={(idx) => handleDeleteOrganization(activeLocation.id, idx)}
                    isSuperAdmin={isLoggedIn}
                  />
                </div>
              )}

              {locationTab === 'history' && (
                <div className="grid grid-cols-1 max-w-4xl mx-auto">
                  {/* Local chronological achievement milestones */}
                  <TimelineView timeline={activeLocation.timeline} />
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* FOOTER credit credits - keeping visual boundaries clean */}
      <footer className="pt-8 pb-4 border-t border-slate-200 mt-12 text-center text-xs text-slate-400 font-sans" id="applet-system-credits">
        <p className="font-medium text-slate-500">Dashboard pengorganisasian DFW Indonesia</p>
        <p className="mt-1 font-mono">Dokumentasi Terstruktur &bull; Hak Cipta &copy; 2026 DFW Indonesia</p>
      </footer>

      {/* KPI Edit & Add Modal component */}
      <KPIEditModal
        isOpen={isKPIModalOpen}
        onClose={() => setIsKPIModalOpen(false)}
        locations={locations}
        onSave={handleSaveKPIStats}
        initialLocationId={kpiModalLocationId}
        isSuperAdmin={isLoggedIn}
      />

      {/* Tambah Lokasi / Hub Baru Modal */}
      {isAddLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop screen */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={closeAddLocationModal}
          />

          {/* Modal Container */}
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 font-sans">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm md:text-base text-slate-900 uppercase">
                    {editingLocationId ? 'Sunting Wilayah Jaringan Kerja' : 'Tambah Hub / Posko Wilayah Baru'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans">
                    {editingLocationId ? 'Perbarui informasi spasial dan statis wilayah hub pantau' : 'Daftarkan pelabuhan baru ke dalam Jaringan Pantau Nasional'}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeAddLocationModal} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 font-sans">
              
              {/* Preset Port Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Pilih Preset Pelabuhan Indonesia (Opsional)
                </label>
                <select
                  value={addLocForm.preset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-250 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden transition-all text-slate-800"
                >
                  <option value="">-- Buat Kustom / Pilih Lainnya --</option>
                  {PRESET_PORTS.map((port) => (
                    <option key={port.name} value={port.name}>
                      {port.name} ({port.province})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Memilih preset otomatis memetakan koordinat geospasial pulau Indonesia yang sesuai.
                </span>
              </div>

              {/* Grid: Name and Province */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nama Hub / Pelabuhan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Belawan"
                    value={addLocForm.name}
                    onChange={(e) => setAddLocForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sumatera Utara"
                    value={addLocForm.province}
                    onChange={(e) => setAddLocForm(prev => ({ ...prev, province: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-250 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Coordinates configuration sliders */}
              <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>📍 Penempatan Pin Peta</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    X: {addLocForm.x}% | Y: {addLocForm.y}%
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5 font-semibold text-slate-500">
                      <span>Garis Bujur (Posisi Horizontal X)</span>
                      <span>Barat ({addLocForm.x}%) Timur</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={addLocForm.x}
                      onChange={(e) => setAddLocForm(prev => ({ ...prev, x: Number(e.target.value), preset: '' }))}
                      className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5 font-semibold text-slate-500">
                      <span>Garis Lintang (Posisi Vertikal Y)</span>
                      <span>Utara ({addLocForm.y}%) Selatan</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={addLocForm.y}
                      onChange={(e) => setAddLocForm(prev => ({ ...prev, y: Number(e.target.value), preset: '' }))}
                      className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Initial targets KPI metrics */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 pb-1">
                  Inisiasi Target Capaian & Kasus Posko Awal
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Pekerja Didampingi</label>
                    <input
                      type="number"
                      min="0"
                      value={addLocForm.workersReached}
                      onChange={(e) => setAddLocForm(prev => ({ ...prev, workersReached: parseInt(e.target.value) || 0 }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-lg text-slate-850 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Lingkar Belajar</label>
                    <input
                      type="number"
                      min="0"
                      value={addLocForm.activeLearningCircles}
                      onChange={(e) => setAddLocForm(prev => ({ ...prev, activeLearningCircles: parseInt(e.target.value) || 0 }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-lg text-slate-850 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Peserta Lingkaran</label>
                    <input
                      type="number"
                      min="0"
                      value={addLocForm.circleParticipants}
                      onChange={(e) => setAddLocForm(prev => ({ ...prev, circleParticipants: parseInt(e.target.value) || 0 }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-lg text-slate-850 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Kader Penggerak</label>
                    <input
                      type="number"
                      min="0"
                      value={addLocForm.championsCount}
                      onChange={(e) => setAddLocForm(prev => ({ ...prev, championsCount: parseInt(e.target.value) || 0 }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-lg text-slate-850 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Anggota Serikat</label>
                    <input
                      type="number"
                      min="0"
                      value={addLocForm.organizationMembers}
                      onChange={(e) => setAddLocForm(prev => ({ ...prev, organizationMembers: parseInt(e.target.value) || 0 }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-lg text-slate-850 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Kasus Diterima</label>
                    <input
                      type="number"
                      min="0"
                      value={addLocForm.casesCount}
                      onChange={(e) => setAddLocForm(prev => ({ 
                        ...prev, 
                        casesCount: parseInt(e.target.value) || 0,
                        casesSolved: Math.min(parseInt(e.target.value) || 0, prev.casesSolved) 
                      }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-lg text-slate-850 font-mono"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Kasus Selesai</label>
                    <input
                      type="number"
                      min="0"
                      max={addLocForm.casesCount}
                      value={addLocForm.casesSolved}
                      onChange={(e) => setAddLocForm(prev => ({ 
                        ...prev, 
                        casesSolved: Math.min(prev.casesCount, parseInt(e.target.value) || 0) 
                      }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-250 rounded-lg text-slate-850 font-mono bg-emerald-50/50 border-emerald-200 text-emerald-800"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Error alerts or helpful instructions */}
            <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-[10px] text-amber-900 leading-relaxed font-sans mt-4">
              <strong>💡 Catatan Sistem:</strong> Hub baru yang didaftarkan akan secara dinamis ditambahkan pada tabel rujukan sidebar utama, peta interaktif nasional, serta drop-down pengurus advokasi. Data awal ini dapat direstrukturisasi atau ditambahkan kasus spesifik secara bertahap.
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-5 font-sans">
              <button
                type="button"
                onClick={closeAddLocationModal}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddNewLocation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-md cursor-pointer uppercase tracking-wider"
              >
                {editingLocationId ? 'Simpan Perubahan' : 'Inisiasi Hub Baru'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Superadmin Authentication Modal (Google Sign-In Direct Access) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsAuthModalOpen(false)}
          />

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden relative z-10 transition-all font-sans">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-indigo-650" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase">
                    Verifikasi Instan Google
                  </h4>
                  <p className="text-[9px] text-slate-500 font-sans">
                    Akses kontrol penuh Jaringan Pantau DFW
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAuthModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-5 space-y-4 text-left">
              <div className="text-[11px] text-slate-600 leading-relaxed bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3.5 space-y-1">
                <p className="font-extrabold text-indigo-900">🔒 Akses Dibatasi Koordinator Lapangan</p>
                <p>Gunakan akun Google terdaftar untuk mengizinkan perubahan data spasial, kpi capaian wilayah baru, dan pengelolaan kasus terpusat.</p>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!supabase) {
                      alert("Akses login Google memerlukan integrasi database Supabase aktif.\n\nSilakan masukkan kredensial Supabase Anda terlebih dahulu di tombol 'Atur' di pojok kiri bawah sidebar!");
                      return;
                    }
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: window.location.origin + window.location.pathname
                        }
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      alert("Gagal menginisiasi OAuth Google via Supabase: " + err.message);
                    }
                  }}
                  className={`w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:shadow-md border active:scale-[0.98] ${supabase ? 'bg-indigo-600 hover:bg-indigo-750 border-indigo-700 hover:border-indigo-800' : 'bg-slate-450 hover:bg-slate-500 border-slate-500'}`}
                >
                  <Chrome className="w-4 h-4 text-white" />
                  Masuk dengan Google
                </button>
                <p className="text-[9px] text-center text-slate-400 font-sans leading-normal">
                  {supabase 
                    ? "✓ Server Supabase terhubung. Email Google Anda otomatis divalidasi sebagai administrator." 
                    : "⚠️ Mode Demo Offline. Klik 'Atur' di sidebar kiri untuk menghubungkan DB Anda agar login Google ini dapat berjalan aktif."
                  }
                </p>
              </div>
            </div>
                 {/* Actions Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400 font-medium text-[9px]">
                DFW Security System
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg bg-white hover:bg-slate-50 hover:text-slate-800 transition-all text-xs font-bold cursor-pointer shadow-2xs active:scale-[0.97]"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
