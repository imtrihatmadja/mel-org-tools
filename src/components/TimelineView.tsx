import React from 'react';
import { TimelineEvent } from '../types';
import { Award, Compass, HeartHandshake, History, Calendar } from 'lucide-react';

interface TimelineProps {
  timeline: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineProps> = ({ timeline }) => {
  const getCategoryIcon = (category: 'pencapaian' | 'kasus' | 'organisasi') => {
    switch (category) {
      case 'pencapaian':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'kasus':
        return <HeartHandshake className="w-4 h-4 text-rose-600" />;
      case 'organisasi':
        return <Compass className="w-4 h-4 text-indigo-600" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryStyle = (category: 'pencapaian' | 'kasus' | 'organisasi') => {
    switch (category) {
      case 'pencapaian':
        return {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'ring-4 ring-emerald-100 bg-emerald-500'
        };
      case 'kasus':
        return {
          badge: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'ring-4 ring-rose-100 bg-rose-500'
        };
      case 'organisasi':
        return {
          badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'ring-4 ring-indigo-100 bg-indigo-500'
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'ring-4 ring-slate-100 bg-slate-500'
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-full" id="timeline-journal-panel">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h4 className="font-sans font-bold text-slate-800 text-sm md:text-base">
            Linimasa Kegiatan & Advokasi
          </h4>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Kronologis Terbaru</span>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-3.5 space-y-6 flex-1 overflow-y-auto max-h-[360px] pr-1">
        {timeline.map((event, index) => {
          const styles = getCategoryStyle(event.category);
          return (
            <div key={index} className="relative pl-6">
              {/* Timeline bubble bullet dot */}
              <span className={`absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center ${styles.dot}`}>
                {getCategoryIcon(event.category)}
              </span>

              {/* Event Card Content */}
              <div className="flex flex-col gap-1">
                <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {event.date}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${styles.badge}`}>
                    {event.category}
                  </span>
                </div>

                <h5 className="font-bold text-slate-900 text-xs sm:text-sm mt-1">{event.title}</h5>
                <p className="text-slate-500 text-xs leading-relaxed font-sans mt-0.5">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TimelineView;
