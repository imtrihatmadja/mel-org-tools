import React, { useState } from 'react';
import { Case } from '../types';
import { AlertCircle, PlusCircle, Check, HelpCircle, Lightbulb } from 'lucide-react';

interface SimulationPanelProps {
  onAddCase: (locationId: string, caseData: Omit<Case, 'id' | 'date'>) => void;
  locationsList: Array<{ id: string; name: string }>;
  issueCategories: string[];
  onOpenAddReflection?: () => void;
  isSuperAdmin?: boolean;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  onAddCase,
  locationsList,
  issueCategories,
  onOpenAddReflection,
  isSuperAdmin = false
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
    if (!isSuperAdmin) {
      alert("Akses Terkunci: Maaf, Anda saat ini mengakses dalam Mode Guest. Silakan login sebagai Superadmin.");
      return;
    }
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
            <h4 className="font-sans font-bold text-slate-800 text-sm md:text-base leading-tight flex items-center gap-1.5">
              Simulator Input Pengaduan Kasus ABK
              {!isSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                  🔒 GUEST MODE
                </span>
              )}
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
              onClick={isOpen && !isSuperAdmin ? undefined : onOpenAddReflection}
              disabled={isOpen && !isSuperAdmin}
              className={`inline-flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all shadow-2xs flex-1 sm:flex-initial text-center ${
                isOpen && !isSuperAdmin
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 cursor-pointer'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Tambah Refleksi & Pembelajaran</span>
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-5 pt-5 border-t border-slate-100 space-y-4">
          
          {!isSuperAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Fasilitas Formulir Terkunci (Read-Only)</span>
                <span className="text-[11px] text-slate-650">Anda masuk dengan peran pengunjung umum (Guest). Untuk melakukan simulasi penambahan data baru, silakan Login dengan akun Superadmin (admin@dfw.or.id) menggunakan tombol login di sidebar.</span>
              </div>
            </div>
          )}

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
                disabled={!isSuperAdmin}
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={!isSuperAdmin}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                    disabled={!isSuperAdmin}
                    onClick={() => setImpactLevel(lvl)}
                    className={`flex-1 text-[11px] py-1.5 rounded-md font-semibold transition-all border disabled:opacity-60 disabled:cursor-not-allowed ${
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
                disabled={!isSuperAdmin}
                placeholder="cth: Sutrisno Hartono, Kru Kapal Bahtera"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Case Title */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Judul Laporan Singkat</label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                placeholder="cth: Gaji Ditahan Selama 3 Bulan di KM Tuna Prima"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600">Uraian Kronologis Kejadian</label>
            <textarea
              required
              rows={3}
              disabled={!isSuperAdmin}
              placeholder="Jelaskan secara singkat urutan kejadian, pihak pelaku, tuntutan korban, dan bukti penunjang penahanan dokumen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={!isSuperAdmin}
              onClick={() => {
                setTitle("");
                setDescription("");
                setReporter("");
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kosongkan Input
            </button>
            <button
              type="submit"
              disabled={!isSuperAdmin}
              className={`px-5 py-2 border rounded-lg transition-all text-xs font-bold ${
                isSuperAdmin
                  ? 'bg-slate-900 border-slate-950 text-white hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
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
