import React from 'react';
import { LocationStats } from '../types';
import {
  Users,
  Award,
  Compass,
  CheckSquare,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  Activity
} from 'lucide-react';

interface KPICardsProps {
  stats: LocationStats;
  isNational?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, isNational = false }) => {
  const solvedRate = Math.round((stats.casesSolved / (stats.casesCount || 1)) * 100);

  const kpis = [
    {
      id: 'reached',
      title: 'Pekerja Perikanan Dijangkau',
      value: stats.workersReached.toLocaleString(),
      subtitle: isNational ? 'Akumulasi seluruh hub aktif' : 'Total sosialisasi pelabuhan',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      change: '+12%',
      progressColor: 'bg-blue-500',
      progressPercent: '72%'
    },
    {
      id: 'circles',
      title: 'Lingkaran Belajar ABK',
      value: stats.activeLearningCircles,
      subtitle: `${stats.circleParticipants} peserta aktif reguler`,
      icon: Compass,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      change: '87% Cap.',
      progressColor: 'bg-amber-500',
      progressPercent: '87%'
    },
    {
      id: 'champions',
      title: 'Kader Penggerak (Champions)',
      value: stats.championsCount,
      subtitle: 'ABK Pelopor aktif mendampingi',
      icon: Award,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      change: 'Port Leaders',
      progressColor: 'bg-indigo-500',
      progressPercent: '42%'
    },
    {
      id: 'members',
      title: 'Anggota Serikat Terorganisir',
      value: stats.organizationMembers.toLocaleString(),
      subtitle: 'Terdaftar di serikat mitra kerja',
      icon: Activity,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
      change: '64% Target',
      progressColor: 'bg-sky-500',
      progressPercent: '64%'
    },
    {
      id: 'cases',
      title: 'Tingkat Solusi Kasus',
      value: `${solvedRate}%`,
      subtitle: `${stats.casesSolved} dari ${stats.casesCount} aduan selesai`,
      icon: CheckSquare,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      change: 'Rasio Solusi',
      progressColor: 'bg-rose-500',
      progressPercent: `${Math.min(100, Math.max(10, solvedRate))}%`
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="kpi-cards-grid">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {kpi.title}
              </span>
              <span className={`p-1.5 rounded-lg border ${kpi.color}`}>
                <Icon className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
                  {kpi.value}
                </span>
                {kpi.change && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    kpi.id === 'reached' ? 'text-emerald-600 bg-emerald-50' : 
                    kpi.id === 'circles' ? 'text-blue-600 bg-blue-50' : 
                    kpi.id === 'cases' ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-50'
                  }`}>
                    {kpi.change}
                  </span>
                )}
              </div>

              {/* Bottom linear progress indicator bar matching the styled template */}
              <div className="h-1 bg-slate-100 rounded-full mt-3.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${kpi.progressColor}`}
                  style={{ width: kpi.progressPercent }}
                ></div>
              </div>

              <div className="text-[10px] text-slate-400 font-medium truncate mt-2">
                {kpi.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default KPICards;
