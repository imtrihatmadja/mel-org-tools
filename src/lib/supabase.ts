import { createClient } from '@supabase/supabase-js';
import { LocationData, Case, Reflection, Champion, WorkerOrganization, Beneficiary, HistoricalTrend, TimelineEvent } from '../types';

// Membaca kredensial dari environment variable bentukan Vite atau localStorage untuk fleksibilitas di GitHub Pages
// JIKA INGIN INTEGRASI BERJALAN OTOMATIS BAGI SEMUA PENGUNJUNG TANPA PERLU MANUAL MENGATUR KUNCI:
// Masukkan kredensial Supabase Anda di dua variabel DEFAULT di bawah ini.
// (Sangat aman untuk Web App berbasis static client-side di mana Anon Key memang bersifat publik)
const DEFAULT_SUPABASE_URL = "https://hhqaefonrqjztrhonkat.supabase.co" as string;
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocWFlZm9ucnFqenRyaG9ua2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDg1MDgsImV4cCI6MjA5NjgyNDUwOH0.RKfKBSWEtW3byEUunYy35dKS-vmwkuiyFwtc2Z63jtE" as string; // Masukkan Kunci Publik Anon Supabase Anda di sini

export function getSupabaseConfig() {
  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('DFW_SUPABASE_URL');
  const localKey = localStorage.getItem('DFW_SUPABASE_ANON_KEY');

  // Urutan prioritas pembacaan kredensial database:
  // 1. Variabel Lingkungan (.env saat build aplikasi runtime)
  // 2. Penyimpanan Lokal Browser / LocalStorage (dari tombol "Atur" di sidebar)
  // 3. Nilai bawaan/fallback default di file kode ini
  let url = "";
  if (envUrl && envUrl !== "https://your-project-id.supabase.co" && envUrl !== "") {
    url = envUrl;
  } else if (localUrl) {
    url = localUrl;
  } else if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_URL !== "") {
    url = DEFAULT_SUPABASE_URL;
  }

  let key = "";
  if (envKey && envKey !== "your-anon-public-key" && envKey !== "") {
    key = envKey;
  } else if (localKey) {
    key = localKey;
  } else if (DEFAULT_SUPABASE_ANON_KEY && DEFAULT_SUPABASE_ANON_KEY !== "") {
    key = DEFAULT_SUPABASE_ANON_KEY;
  }

  const isConfigured = Boolean(
    url && 
    key && 
    url !== "https://your-project-id.supabase.co" && 
    url !== "" && 
    key !== "your-anon-public-key" && 
    key !== ""
  );

  return {
    supabaseUrl: url?.trim() || '',
    supabaseAnonKey: key?.trim() || '',
    isConfigured
  };
}

const config = getSupabaseConfig();

// Menentukan apakah Supabase sudah terkonfigurasi dengan benar secara global
export const isSupabaseConfigured = config.isConfigured;

/**
 * Inisialisasi client Supabase secara aman (lazy initialization).
 * Jika variabel belum diatur, akan mereturn null sehingga modul tidak merusak rendering client.
 */
export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase belum dikonfigurasi secara lengkap.\n" +
    "Masukkan kredensial real Anda di file .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)\n" +
    "atau tambahkan lewat tombol Atur Integrasi di sidebar dashboard Anda!"
  );
}

// Interface Helper untuk sinkronisasi data
export interface SyncStatus {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Membaca seluruh data dari Supabase secara terintegrasi dan paralel.
 * Mengembalikan objek berisi seluruh entitas yang sesuai dengan type sistem React kita.
 */
export async function fetchAllDataFromSupabase(): Promise<{
  locations: LocationData[];
  beneficiaries: Beneficiary[];
  nationalTrend: HistoricalTrend[];
} | null> {
  if (!supabase) return null;

  try {
    const [
      locsRes,
      orgsRes,
      champsRes,
      casesRes,
      refsRes,
      timelineRes,
      beneficiariesRes,
      trendRes,
      progressNotesRes
    ] = await Promise.all([
      supabase.from('locations').select('*'),
      supabase.from('organizations').select('*'),
      supabase.from('champions').select('*'),
      supabase.from('cases').select('*'),
      supabase.from('reflections').select('*'),
      supabase.from('timeline_events').select('*'),
      supabase.from('beneficiaries').select('*'),
      supabase.from('national_trend').select('*'),
      supabase.from('case_progress_notes').select('*')
    ]);

    // Tangani kemungkinan error pemuatan paralel
    if (locsRes.error) throw locsRes.error;

    // Jika tabel locations benar-benar kosong, inisialisasi dengan 3 hub utama
    let rawLocations = locsRes.data || [];
    if (rawLocations.length === 0) {
      const initialLocs = [
        { id: 'muara-baru', name: 'Muara Baru', province: 'DKI Jakarta', coordinate_x: 30, coordinate_y: 68 },
        { id: 'benoa', name: 'Benoa', province: 'Bali', coordinate_x: 44, coordinate_y: 78 },
        { id: 'bitung', name: 'Bitung', province: 'Sulawesi Utara', coordinate_x: 74, coordinate_y: 39 },
      ];
      const { data: insertedData, error: insertErr } = await supabase.from('locations').insert(initialLocs).select();
      if (insertErr) {
        console.error("Gagal melakukan seeding awal lokasi ke Supabase:", insertErr);
      } else if (insertedData) {
        rawLocations = insertedData;
      }
    }

    const rawOrgs = orgsRes.data || [];
    const rawChamps = champsRes.data || [];
    const rawCases = casesRes.data || [];
    const rawRefs = refsRes.data || [];
    const rawTimeline = timelineRes.data || [];
    const rawBeneficiaries = beneficiariesRes.data || [];
    const rawTrend = trendRes.error ? [] : (trendRes.data || []);
    const rawProgressNotes = progressNotesRes?.data || [];

    // Konversi entitas Supabase ke Struktur Jaringan Data yang diharapkan state React
    const formattedLocations: LocationData[] = rawLocations.map((loc: any) => {
      const id = loc.id;
      const filteredOrgs = rawOrgs.filter((o: any) => o.location_id === id);
      const filteredChamps = rawChamps.filter((c: any) => c.location_id === id);
      const filteredCases = rawCases.filter((c: any) => c.location_id === id);
      const filteredRefs = rawRefs.filter((r: any) => r.location_id === id);
      const filteredTimeline = rawTimeline.filter((t: any) => t.location_id === id);

      const mappingOrgs: WorkerOrganization[] = filteredOrgs.map((o: any) => ({
        name: o.name,
        type: o.type,
        established: o.established || 2020,
        members: o.members || 0,
        picName: o.pic_name || o.picName || '',
        picPhone: o.pic_phone || o.picPhone || '',
        picSocials: o.pic_socials || o.picSocials || ''
      }));

      const mappingChamps: Champion[] = filteredChamps.map((c: any) => ({
        name: c.name,
        role: c.role,
        description: c.description || '',
        status: (c.status === 'Inaktif' ? 'Inaktif' : 'Aktif') as 'Aktif' | 'Inaktif',
        phone: c.phone || ''
      }));

      const mappingCases: Case[] = filteredCases.map((c: any) => {
        const caseProgress = rawProgressNotes.filter((p: any) => p.case_id === c.id);
        const mappedProgress = caseProgress.map((p: any) => ({
          date: p.date,
          note: p.note,
          author: p.author || 'Petugas Posko'
        }));

        return {
          id: c.id,
          title: c.title,
          category: c.category,
          status: (c.status || 'Baru') as 'Selesai' | 'Proses' | 'Baru',
          date: c.date,
          description: c.description,
          reporter: c.reporter,
          impact_level: (c.impact_level || 'Sedang') as 'Tinggi' | 'Sedang' | 'Rendah',
          progressNotes: mappedProgress
        };
      });

      // Extract custom map image if any
      const customMapRef = filteredRefs.find((r: any) => r.category === 'PETA_KUSTOM');
      const customMapImage = customMapRef ? customMapRef.content : undefined;

      // Extract map pins if any
      const mapPinsRef = filteredRefs.find((r: any) => r.category === 'PETA_PIN');
      let mapPins: any[] = [];
      if (mapPinsRef) {
        try {
          mapPins = JSON.parse(mapPinsRef.content);
        } catch (e) {
          console.error("Gagal melakukan parse map pins dari Supabase:", e);
        }
      }

      // Extract manual KPI override if any from Supabase
      const kpiOverrideRef = filteredRefs.find((r: any) => r.category === 'KPI_OVERRIDE');
      let localKPIs = null;
      if (kpiOverrideRef) {
        try {
          localKPIs = JSON.parse(kpiOverrideRef.content);
        } catch (e) {
          console.error("Gagal melakukan parse KPI override dari Supabase:", e);
        }
      }

      // Filter out special system reflections for actual display
      const displayRefs = filteredRefs.filter((r: any) => r.category !== 'PETA_KUSTOM' && r.category !== 'PETA_PIN' && r.category !== 'KPI_OVERRIDE');

      const mappingRefs: Reflection[] = displayRefs.map((r: any) => ({
        id: r.id,
        title: r.title,
        date: r.date,
        category: (r.category || 'Kelompok Belajar') as any,
        content: r.content,
        author: r.author
      }));

      const mappingTimeline: TimelineEvent[] = filteredTimeline.map((t: any) => ({
        date: t.date,
        title: t.title,
        description: t.description,
        category: (t.category || 'pencapaian') as any
      }));

      // Menghitung statistik KPI secara dinamis berdasarkan tabel relasional Supabase
      const totalReached = rawBeneficiaries.filter((b: any) => b.location_id === id).length;
      const totalChamps = mappingChamps.length;
      const totalOrgMembers = mappingOrgs.reduce((acc, current) => acc + current.members, 0);
      const totalCases = mappingCases.length;
      const totalSolved = mappingCases.filter(c => c.status === 'Selesai').length;

      // Ambil override data kuantitatif manual dari localStorage jika belum tersemat di Supabase
      if (!localKPIs) {
        const localKPIsJson = localStorage.getItem(`DFW_LOCAL_KPI_${id}`);
        localKPIs = localKPIsJson ? JSON.parse(localKPIsJson) : null;
      }

      const stats = {
        workersReached: Math.max(totalReached, localKPIs?.workersReached || 0),
        activeLearningCircles: localKPIs?.activeLearningCircles || Math.ceil(totalChamps * 0.5) || 1,
        circleParticipants: localKPIs?.circleParticipants || Math.max(totalReached, totalChamps * 8) || 0,
        championsCount: Math.max(totalChamps, localKPIs?.championsCount || 0),
        organizationMembers: Math.max(totalOrgMembers, localKPIs?.organizationMembers || 0),
        casesCount: Math.max(totalCases, localKPIs?.casesCount || 0),
        casesSolved: Math.max(totalSolved, localKPIs?.casesSolved || 0),
        casesPending: Math.max(0, Math.max(totalCases, localKPIs?.casesCount || 0) - Math.max(totalSolved, localKPIs?.casesSolved || 0))
      };

      // Tambahkan kategori sebaran isu berdasarkan data kasus real
      const issueGroup: { [key: string]: number } = {};
      mappingCases.forEach(c => {
        issueGroup[c.category] = (issueGroup[c.category] || 0) + 1;
      });

      const issueCategories = Object.entries(issueGroup).map(([category, count]) => ({
        category,
        count,
        severity: (count > 3 ? 'Tinggi' : count > 1 ? 'Sedang' : 'Rendah') as 'Tinggi' | 'Sedang' | 'Rendah'
      }));

      // Fallback kategori isu jika kosong agar grafik tetap indah
      if (issueCategories.length === 0) {
        issueCategories.push(
          { category: "Pelanggaran Hak Ketenagakerjaan", count: 0, severity: "Tinggi" },
          { category: "Jam Kerja Berlebih", count: 0, severity: "Tinggi" },
          { category: "Gaji Tidak Dibayar", count: 0, severity: "Tinggi" }
        );
      }

      return {
        id,
        name: loc.name,
        province: loc.province,
        coordinates: { x: loc.coordinate_x || 50, y: loc.coordinate_y || 50 },
        stats,
        organizations: mappingOrgs,
        champions: mappingChamps,
        issueCategories,
        cases: mappingCases,
        reflections: mappingRefs,
        timeline: mappingTimeline,
        customMapImage: customMapImage,
        mapPins: mapPins
      };
    });

    const formattedBeneficiaries: Beneficiary[] = rawBeneficiaries.map((b: any) => ({
      id: b.id,
      name: b.name,
      phone: b.phone || '',
      origin: b.origin || '',
      age: b.age || 30,
      category: (b.category || 'Umum') as 'Umum' | 'Champion',
      locationId: b.location_id,
      notes: b.notes || ''
    }));

    const formattedTrend: HistoricalTrend[] = rawTrend.map((t: any) => ({
      year: t.year,
      workersReached: t.workers_reached || 0,
      learningCircles: t.learning_circles || 0,
      casesHandled: t.cases_handled || 0,
      casesSolved: t.cases_solved || 0
    })).sort((a: any, b: any) => a.year - b.year);

    return {
      locations: formattedLocations,
      beneficiaries: formattedBeneficiaries,
      nationalTrend: formattedTrend
    };
  } catch (error) {
    console.error("Gagal memuat data dari Supabase:", error);
    return null;
  }
}
