import { GlobalMockData } from '../types';

export const mockData: GlobalMockData = {
  issueTaxonomyLabels: {
    laborRights: "Pelanggaran Hak Ketenagakerjaan",
    overtime: "Jam Kerja Berlebih",
    socialProtection: "Perlindungan Sosial",
    recruitment: "Masalah Perekrutan",
    violence: "Diskriminasi dan Kekerasan",
    migration: "Keselamatan Migrasi",
    missingWorker: "ABK Hilang",
    forcedLabor: "Risiko Kerja Paksa",
    unpaidWages: "Gaji Tidak Dibayar",
    statelessness: "Status Tanpa Kewarganegaraan",
    workAccident: "Kecelakaan Kerja",
    sickness: "Sakit",
    death: "Kematian"
  },
  locations: [
    {
      id: "muara-baru",
      name: "Muara Baru",
      province: "DKI Jakarta",
      coordinates: { x: 30, y: 68 }, // Koordinat letak pin dalam peta Indonesia SVG
      stats: {
        workersReached: 0,
        activeLearningCircles: 0,
        circleParticipants: 0,
        championsCount: 0,
        organizationMembers: 0,
        casesCount: 0,
        casesSolved: 0,
        casesPending: 0
      },
      organizations: [],
      champions: [],
      issueCategories: [],
      cases: [],
      timeline: [],
      reflections: []
    },
    {
      id: "benoa",
      name: "Benoa",
      province: "Bali",
      coordinates: { x: 44, y: 78 }, // Koordinat Bali
      stats: {
        workersReached: 0,
        activeLearningCircles: 0,
        circleParticipants: 0,
        championsCount: 0,
        organizationMembers: 0,
        casesCount: 0,
        casesSolved: 0,
        casesPending: 0
      },
      organizations: [],
      champions: [],
      issueCategories: [],
      cases: [],
      timeline: [],
      reflections: []
    },
    {
      id: "bitung",
      name: "Bitung",
      province: "Sulawesi Utara",
      coordinates: { x: 74, y: 39 }, // Koordinat Bitung
      stats: {
        workersReached: 0,
        activeLearningCircles: 0,
        circleParticipants: 0,
        championsCount: 0,
        organizationMembers: 0,
        casesCount: 0,
        casesSolved: 0,
        casesPending: 0
      },
      organizations: [],
      champions: [],
      issueCategories: [],
      cases: [],
      timeline: [],
      reflections: []
    }
  ],
  nationalTrend: [],
  beneficiaries: []
};

export default mockData;
