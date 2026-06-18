export interface IssueCategory {
  category: string;
  count: number;
  severity: 'Tinggi' | 'Sedang' | 'Rendah';
}

export interface Reflection {
  id: string;
  title: string;
  date: string;
  category: 'Kelompok Belajar' | 'Advokasi Kasus' | 'Kemitraan' | 'Konsolidasi Serikat' | 'Lainnya';
  content: string;
  author: string;
}

export interface CaseUpdate {
  date: string;
  note: string;
  author?: string;
}

export interface Case {
  id: string;
  title: string;
  category: string;
  status: 'Selesai' | 'Proses' | 'Baru';
  date: string;
  description: string;
  reporter: string;
  impact_level: 'Tinggi' | 'Sedang' | 'Rendah';
  progressNotes?: CaseUpdate[];
  locationId?: string;
  locationName?: string;
}

export interface WorkerOrganization {
  name: string;
  type: string;
  established: number;
  members: number;
  picName?: string;
  picPhone?: string;
  picSocials?: string;
}

export interface Champion {
  name: string;
  role: string;
  description: string;
  status: 'Aktif' | 'Inaktif';
  phone?: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  category: 'pencapaian' | 'kasus' | 'organisasi';
}

export interface LocationStats {
  workersReached: number;
  activeLearningCircles: number;
  circleParticipants: number;
  championsCount: number;
  organizationMembers: number;
  casesCount: number;
  casesSolved: number;
  casesPending: number;
}

export interface AreaMapPin {
  id: string;
  x: number; // percentage (0-100) on the map image
  y: number; // percentage (0-100) on the map image
  label: string; // nama titik / posko
  workersReached: number;
  activity: string; // aktivitas kunci
  progressNotes: string; // catatan perkembangan
  createdAt: string;
  createdBy?: string;
}

export interface LocationData {
  id: string;
  name: string;
  province: string;
  coordinates: { x: number; y: number; originalX?: number; originalY?: number }; // Percentage coordinate on map
  stats: LocationStats;
  organizations: WorkerOrganization[];
  champions: Champion[];
  issueCategories: IssueCategory[];
  cases: Case[];
  reflections?: Reflection[];
  timeline: TimelineEvent[];
  customMapImage?: string; // base64 or url for local hub map
  mapPins?: AreaMapPin[]; // pins placed on the custom map
}

export interface HistoricalTrend {
  year: number;
  workersReached: number;
  learningCircles: number;
  casesHandled: number;
  casesSolved: number;
}

export interface Beneficiary {
  id: string;
  name: string;
  phone: string;
  origin: string; // asal
  age: number;
  category: 'Umum' | 'Champion';
  locationId: string; // e.g. muara-baru, benoa, bitung
  notes: string;
}

export interface ShelterWorker {
  id: string;
  locationId: string;
  name: string;
  identityNo: string;
  origin: string;
  contact: string;
  createdAt: string;
}

export interface ShelterDailyLog {
  id: string;
  locationId: string;
  workerId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Keluar';
  notes?: string;
}

export interface GlobalMockData {
  locations: LocationData[];
  nationalTrend: HistoricalTrend[];
  issueTaxonomyLabels: { [key: string]: string };
  beneficiaries?: Beneficiary[];
}
