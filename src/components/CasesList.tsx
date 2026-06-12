import React, { useState } from 'react';
import { Case, CaseUpdate } from '../types';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Edit2,
  Trash2,
  X,
  Plus,
  Calendar,
  User,
  Clock,
  Check,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface CasesListProps {
  cases: Case[];
  onSelectCase?: (c: Case) => void;
  onUpdateCase?: (locId: string, updatedCase: Case) => void;
  onDeleteCase?: (locId: string, caseId: string) => void;
  defaultLocationId?: string; // fallback if case has no locationId bound
}

export const CasesList: React.FC<CasesListProps> = ({
  cases = [],
  onSelectCase,
  onUpdateCase,
  onDeleteCase,
  defaultLocationId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  
  // Case Editor forms
  const [caseForm, setCaseForm] = useState({
    title: '',
    category: '',
    status: 'Baru' as 'Selesai' | 'Proses' | 'Baru',
    description: '',
    reporter: '',
    impact_level: 'Sedang' as 'Tinggi' | 'Sedang' | 'Rendah',
  });

  // Log progress notes state
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState('Koordinator Lapangan');

  // Deletion prompt state
  const [caseToDelete, setCaseToDelete] = useState<Case | null>(null);

  const getStatusBadge = (status: 'Selesai' | 'Proses' | 'Baru') => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Selesai Advokasi
          </span>
        );
      case 'Proses':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Sedang Diproses
          </span>
        );
      case 'Baru':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Laporan Baru
          </span>
        );
      default:
        return null;
    }
  };

  const getImpactBadge = (level: 'Tinggi' | 'Sedang' | 'Rendah') => {
    switch (level) {
      case 'Tinggi':
        return <span className="text-[10px] bg-red-100 text-red-800 font-mono font-bold px-1.5 py-0.5 rounded-sm">Tinggi</span>;
      case 'Sedang':
        return <span className="text-[10px] bg-orange-100 text-orange-800 font-mono font-medium px-1.5 py-0.5 rounded-sm">Sedang</span>;
      case 'Rendah':
        return <span className="text-[10px] bg-yellow-100 text-yellow-800 font-mono px-1.5 py-0.5 rounded-sm">Rendah</span>;
      default:
        return null;
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "Semua" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenEditModal = (c: Case, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering row select mapping
    setSelectedCase(c);
    setCaseForm({
      title: c.title,
      category: c.category,
      status: c.status,
      description: c.description,
      reporter: c.reporter,
      impact_level: c.impact_level
    });
    setNewNoteText('');
    setNewNoteAuthor('Koordinator Lapangan');
    setIsModalOpen(true);
  };

  const handleAddProgressNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedCase) return;

    // Use current Indonesian formatted time scale or UTC fallback
    const currentDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const newUpdate: CaseUpdate = {
      date: currentDate,
      note: newNoteText,
      author: newNoteAuthor || 'Petugas Posko'
    };

    const updatedNotes = selectedCase.progressNotes
      ? [...selectedCase.progressNotes, newUpdate]
      : [newUpdate];

    const updatedCaseObj: Case = {
      ...selectedCase,
      progressNotes: updatedNotes
    };

    setSelectedCase(updatedCaseObj);
    setNewNoteText('');

    // Persist immediately to global state
    const targetLoc = selectedCase.locationId || defaultLocationId || 'muara-baru';
    if (onUpdateCase) {
      onUpdateCase(targetLoc, updatedCaseObj);
    }
  };

  const handleSaveMetadataChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    const updatedCaseObj: Case = {
      ...selectedCase,
      title: caseForm.title,
      category: caseForm.category,
      status: caseForm.status,
      description: caseForm.description,
      reporter: caseForm.reporter,
      impact_level: caseForm.impact_level
    };

    setSelectedCase(updatedCaseObj);

    // Persist immediately to global state
    const targetLoc = selectedCase.locationId || defaultLocationId || 'muara-baru';
    if (onUpdateCase) {
      onUpdateCase(targetLoc, updatedCaseObj);
    }

    setIsModalOpen(false);
  };

  const handleDeleteTrigger = (c: Case, e: React.MouseEvent) => {
    e.stopPropagation();
    setCaseToDelete(c);
  };

  const handleConfirmDelete = () => {
    if (!caseToDelete) return;

    const targetLoc = caseToDelete.locationId || defaultLocationId || 'muara-baru';
    if (onDeleteCase) {
      onDeleteCase(targetLoc, caseToDelete.id);
    }

    setCaseToDelete(null);
    if (selectedCase?.id === caseToDelete.id) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full" id="cases-tracker-panel">
      
      {/* Panel Actions / Filter Controls */}
      <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="font-sans font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Dokumentasi & Register Kasus Lapangan
          </h4>
          <p className="text-slate-500 text-xs font-sans mt-0.5">
            Manajemen dan rekapitulasi pelaporan dugaan pelanggaran hukum laut, K3, dan eksploitasi hak ketenagakerjaan ABK harian.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {['Semua', 'Baru', 'Proses', 'Selesai'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'Semua' ? 'Semua Kasus' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan ID, judul kasus, pelapor, kronologis, atau kategori isu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-sans"
          />
        </div>
        <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap hidden sm:block">
          Ditemukan <strong>{filteredCases.length}</strong> kasus
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-x-auto min-h-[250px]">
        {filteredCases.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-sans flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <span className="text-xs font-semibold">Tidak ada berkas kasus yang cocok dengan kriteria pencarian dan saringan Anda.</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="p-2 md:p-4 w-16 md:w-28 text-[9px] md:text-[10px]">ID</th>
                <th className="p-2 md:p-4 text-[9px] md:text-[10px]">Deskripsi Kronologis / Kasus</th>
                <th className="p-2 md:p-4 w-44 text-[9px] md:text-[10px] hidden md:table-cell">Kategori Isu</th>
                <th className="p-2 md:p-4 w-24 md:w-32 text-[9px] md:text-[10px]">Status</th>
                <th className="p-2 md:p-4 w-24 text-[9px] md:text-[10px] hidden sm:table-cell">Tingkat Isu</th>
                <th className="p-2 md:p-4 w-28 text-[9px] md:text-[10px] hidden lg:table-cell">Pelapor</th>
                <th className="p-2 md:p-4 w-20 md:w-24 text-right text-[9px] md:text-[10px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase && onSelectCase(c)}
                  className={`hover:bg-slate-50/50 transition-colors ${onSelectCase ? 'cursor-pointer' : ''}`}
                >
                  <td className="p-2 md:p-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                    <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 text-[9px] md:text-[10px]">#{c.id}</span>
                  </td>
                  
                  <td className="p-2 md:p-4 max-w-xs md:max-w-md">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        <span className="md:hidden px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-bold uppercase tracking-wide">
                          {c.category}
                        </span>
                        <span className="sm:hidden text-[9px] bg-orange-50 text-orange-850 font-bold px-1.5 py-0.5 rounded-sm border border-orange-100">
                          {c.impact_level} Impact
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs md:text-sm line-clamp-1">
                        {c.title}
                      </span>
                      <span className="text-slate-500 text-[11px] md:text-xs font-sans line-clamp-2 mt-1">
                        {c.description}
                      </span>
                      
                      {/* Interactive indicator of existing progress notes */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[9px] text-slate-400 font-mono">
                          Dilaporkan: {new Date(c.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        {c.progressNotes && c.progressNotes.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {c.progressNotes.length} Log
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-2 md:p-4 hidden md:table-cell">
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-extrabold uppercase tracking-wide whitespace-nowrap">
                      {c.category}
                    </span>
                  </td>

                  <td className="p-2 md:p-4 whitespace-nowrap">
                    {getStatusBadge(c.status)}
                  </td>

                  <td className="p-2 md:p-4 whitespace-nowrap hidden sm:table-cell">
                    {getImpactBadge(c.impact_level)}
                  </td>

                  <td className="p-2 md:p-4 text-slate-500 font-medium whitespace-nowrap hidden lg:table-cell">
                    {c.reporter}
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEditModal(c, e)}
                        className="p-1 px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer text-[10px]"
                        title="Sunting Kasus & Log Perkembangan"
                      >
                        <Edit2 className="w-3 h-3 text-blue-500" />
                        Kelola
                      </button>
                      
                      {onDeleteCase && (
                        <button
                          onClick={(e) => handleDeleteTrigger(c, e)}
                          className="p-1.5 rounded-lg border border-red-150 text-slate-400 hover:bg-red-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Kasus"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAILED VIEW / EDIT MODAL */}
      {isModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] md:h-[80vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
            
            {/* Left Box: Edit metadata Form */}
            <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-100 overflow-y-auto flex flex-col">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950 text-white font-mono text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                    KASUS #{selectedCase.id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Form Advokasi</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Metadata */}
              <form onSubmit={handleSaveMetadataChanges} className="space-y-4 flex-1">
                
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 font-sans">Judul Kasus / Laporan *</label>
                  <input
                    type="text"
                    required
                    value={caseForm.title}
                    onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-sans text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Status Advokasi & Tingkat Isu */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Status Advokasi *</label>
                    <select
                      value={caseForm.status}
                      onChange={(e) => setCaseForm({ ...caseForm, status: e.target.value as 'Selesai' | 'Proses' | 'Baru' })}
                      className="w-full text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="Baru">Laporan Baru</option>
                      <option value="Proses">Sedang Diproses</option>
                      <option value="Selesai">Selesai Advokasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tingkat Dampak *</label>
                    <select
                      value={caseForm.impact_level}
                      onChange={(e) => setCaseForm({ ...caseForm, impact_level: e.target.value as 'Tinggi' | 'Sedang' | 'Rendah' })}
                      className="w-full text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="Tinggi">Dampak Tinggi (Sangat Parah)</option>
                      <option value="Sedang">Dampak Sedang</option>
                      <option value="Rendah">Dampak Rendah / Sederhana</option>
                    </select>
                  </div>
                </div>

                {/* Kategori Isu & Pelapor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Kategori Utama *</label>
                    <input
                      type="text"
                      required
                      value={caseForm.category}
                      onChange={(e) => setCaseForm({ ...caseForm, category: e.target.value })}
                      placeholder="Misal: Pelanggaran K3"
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pelapor / Sumber Adun *</label>
                    <input
                      type="text"
                      required
                      value={caseForm.reporter}
                      onChange={(e) => setCaseForm({ ...caseForm, reporter: e.target.value })}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Kronologi */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Deskripsi & Kronologis Kasus *</label>
                  <textarea
                    required
                    value={caseForm.description}
                    onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
                    rows={4}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-sans text-slate-700 bg-slate-50' focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    Disimpan sebagai perwakilan {selectedCase.locationName || 'Hub Pantai'}
                  </span>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-bold cursor-pointer transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Simpan Perubahan
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* Right Box: Timeline Notes and adding progress log */}
            <div className="w-full md:w-1/2 p-6 bg-slate-50 overflow-y-auto flex flex-col justify-between">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Catatan Perkembangan & Log Kasus
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hidden md:block"
                >
                  <X className="w-5 h-5 animate-spin-once" />
                </button>
              </div>

              {/* Progress Timeline List Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 min-h-[160px]">
                {!selectedCase.progressNotes || selectedCase.progressNotes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-1.5">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-medium">Belum ada catatan perkembangan terdaftar.</p>
                    <p className="text-[10px] text-slate-400">Gunakan formulir di bawah untuk menambahkan langkah advokasi lapangan.</p>
                  </div>
                ) : (
                  <div className="relative pl-3 border-l border-indigo-200 space-y-4 ml-1.5">
                    {selectedCase.progressNotes.map((note, idx) => (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-[17.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white group-hover:scale-125 transition-transform" />
                        
                        <div className="bg-white border border-slate-200/85 p-3 rounded-xl shadow-2xs space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-extrabold text-indigo-700 font-sans flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {note.author || 'Petugas Posko'}
                            </span>
                            <span className="text-slate-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-300" />
                              {note.date}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-700 leading-relaxed font-sans mt-1.5 whitespace-pre-line">
                            {note.note}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Progress note Form */}
              <form onSubmit={handleAddProgressNote} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Entri Log Perkembangan Baru</span>
                  
                  {/* Author identifier input */}
                  <input
                    type="text"
                    required
                    placeholder="Pelaksana (Misal: Koordinator)"
                    value={newNoteAuthor}
                    onChange={(e) => setNewNoteAuthor(e.target.value)}
                    className="text-[10px] font-bold border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none transition-all px-1 py-0.5 text-right text-indigo-700 w-36 bg-slate-50 hover:bg-slate-100 rounded focus:bg-white"
                  />
                </div>

                <div className="relative">
                  <textarea
                    required
                    rows={2}
                    placeholder="Tulis langkah pendampingan, mediasi, atau pencairan hak yang baru terlaksana..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full text-xs font-semibold focus:font-medium border border-slate-200 focus:border-blue-500 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-sans text-slate-700 bg-slate-50 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 hover:shadow-2xs text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Masukkan Catatan
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* DELETION CONFIRMATION DIALOG MODAL */}
      {caseToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setCaseToDelete(null)} />
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full p-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">Konfirmasi Hapus Kasus</h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Apakah Anda yakin ingin menghapus berkas kasus <strong className="text-slate-800">#{caseToDelete.id}</strong> - <em>"{caseToDelete.title}"</em>? Tindakan ini permanen dan akan mengurangi statistik KPI.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setCaseToDelete(null)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-650 hover:bg-rose-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer transition-colors"
              >
                Ya, Hapus Kasus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default CasesList;
