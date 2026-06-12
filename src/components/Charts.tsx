import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { IssueCategory, HistoricalTrend } from '../types';
import { Info, BarChart3, TrendingUp } from 'lucide-react';

interface ChartsProps {
  issueData: IssueCategory[];
  trendData: HistoricalTrend[];
  titlePrefix?: string;
}

export const Charts: React.FC<ChartsProps> = ({ issueData, trendData, titlePrefix = "Nasional" }) => {
  // Sort issues descending for cleaner presentation
  const sortedIssues = [...issueData].sort((a, b) => b.count - a.count);

  // Palette values tailored for fisheries monitoring taxonomy
  const COLORS = {
    Tinggi: '#ef4444', // Red-500
    Sedang: '#f97316', // Orange-500
    Rendah: '#eab308'  // Yellow-500
  };

  const getSeverityColor = (severity: 'Tinggi' | 'Sedang' | 'Rendah') => {
    return COLORS[severity] || '#6366f1';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts-container">
      {/* 1. Bar Chart for Issue Taxonomy Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-[350px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h4 className="font-sans font-semibold text-slate-800 text-sm md:text-base">
              Distribusi Isu & Kasus Utama ({titlePrefix})
            </h4>
          </div>
          <span className="text-[10px] bg-slate-100 font-mono text-slate-500 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Info className="w-3 h-3" /> Berdasarkan Laporan Masuk
          </span>
        </div>

        <div className="flex-1 w-full text-xs">
          {sortedIssues.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              Tidak ada data isu yang tercatat.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedIssues}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#475569"
                  fontSize={10}
                  width={100}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => value.length > 16 ? `${value.substring(0, 14)}..` : value}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {sortedIssues.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Historical Trend Area Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-[350px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h4 className="font-sans font-semibold text-slate-800 text-sm md:text-base">
              Tren Historis Capaian Nasional
            </h4>
          </div>
          <span className="text-[10px] bg-indigo-50 font-sans text-indigo-600 px-2.5 py-1 rounded-full font-medium">
            2022 - 2026 (YTD)
          </span>
        </div>

        <div className="flex-1 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
              
              <Area
                name="Suku Belajar Aktif (x10)"
                type="monotone"
                dataKey={(data) => data.learningCircles * 10}
                stroke="#f59e0b"
                fill="none"
                strokeWidth={2}
              />
              <Area
                name="Pekerja Dijangkau"
                type="monotone"
                dataKey="workersReached"
                stroke="#4f46e5"
                fillOpacity={1}
                fill="url(#colorReach)"
                strokeWidth={2}
              />
              <Area
                name="Kasus Selesai"
                type="monotone"
                dataKey="casesSolved"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorSolved)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default Charts;
