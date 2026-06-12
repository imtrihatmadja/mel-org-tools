import React, { useState } from 'react';
import { Case } from '../types';
import { AlertCircle, PlusCircle, Check, HelpCircle, Lightbulb } from 'lucide-react';

interface SimulationPanelProps {
  onAddCase: (locationId: string, caseData: Omit<Case, 'id' | 'date'>) => void;
  locationsList: Array<{ id: string; name: string }>;
  issueCategories: string[];
  onOpenAddReflection?: () => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  onAddCase,
  locationsList,
  issueCategories,
  onOpenAddReflection
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(locationsList[0]?.id || "");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(issueCategories[0] || "");
  const [reporter, setReporter] = useState("");
  const [impactLevel, setImpactLevel] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [description, setDescription] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !reporter) {
      alert("Harap lengkapi semua isian laporan.");
      return;
    }

    onAddCase(selectedLoc, {
      title,
      category,
      status: 'Baru',
      description,
      reporter,
      impact_level: impactLevel
    });

    setTitle("");
    setDescription("");
    setReporter("");
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="simulation-submission-form">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-2.5">
          <PlusCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm md:text-base leading-tight">
              Simulator Input Pengaduan Kasus ABK
            </h4>
            <p className="text-slate-500 text-[11px] font-sans mt-0.5">
              Simulasi alur data langsung. Menambahkan laporan baru akan mengubah grafik trend & KPI sebaran secara otomatis.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
              isOpen
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
            }`}
          >
            {isOpen ? 'Tutup Formulir' : 'Buka Formulir Baru'}
          </button>
 
          {onOpenAddReflection && (
            <button
              type="button"
              onClick={onOpenAddReflection}
              className="inline-flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 rounded-lg font-semibold transition-all cursor-pointer shadow-2xs flex-1 sm:flex-initial text-center"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-100" />
              <span>Tambah Refleksi & Pembelajaran</span>
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-5 pt-5 border-t border-slate-100 space-y-4">
          
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Laporan berhasil disimulasikan! KPI Wilayah, Status Advokasi, dan Grafik Sebaran Isu langsung diperbaharui otomatis.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Location Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Wilayah Masuk Laporan</label>
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Kategori Masalah (Taksonomi)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                {issueCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">Tingkat Ancaman Isu</label>
              <div className="flex items-center gap-1.5">
                {(['Tinggi', 'Sedang', 'Rendah'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setImpactLevel(lvl)}
                    className={`flex-1 text-[11px] py-1.5 rounded-md font-semibold transition-all border ${
                      impactLevel === lvl
                        ? lvl === 'Tinggi'
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : lvl === 'Sedang'
                          ? 'bg-orange-50 text-orange-700 border-orange-300'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Reporter Name */}
            <div className="flex flex-col gap-1.5 lg:col-span-1">
              <label className="text-xs font-bold text-slate-600">Fasilitator Lapangan / Pelapor</label>
              <input
                type="text"
                required
                placeholder="cth: Sutrisno Hartono, Kru Kapal Bahtera"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Case Title */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Judul Laporan Singkat</label>
              <input
                type="text"
                required
                placeholder="cth: Gaji Ditahan Selama 3 Bulan di KM Tuna Prima"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600">Uraian Kronologis Kejadian</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan secara singkat urutan kejadian, pihak pelaku, tuntutan korban, dan bukti penunjang penahanan dokumen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setDescription("");
                setReporter("");
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-xs font-semibold"
            >
              Kosongkan Input
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 border border-slate-950 text-white rounded-lg hover:bg-slate-800 transition-all text-xs font-bold"
            >
              Simulasikan Masuk Dokumen Laporan
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default SimulationPanel;
