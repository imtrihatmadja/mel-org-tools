import React, { useState } from 'react';
import { Reflection } from '../types';
import {
  Lightbulb,
  Search,
  BookOpen,
  Calendar,
  User,
  Plus,
  Trash2,
  X,
  Edit2,
  MapPin,
  Filter,
  ArrowRight
} from 'lucide-react';

interface NationalReflectionItem extends Reflection {
  locationId: string;
  locationName: string;
}

interface NationalReflectionsListProps {
  reflections: NationalReflectionItem[];
  onAddReflection: (locId: string, reflection: Omit<Reflection, 'id' | 'date'>) => void;
  onUpdateReflection: (locId: string, refId: string, updated: Reflection) => void;
  onDeleteReflection: (locId: string, refId: string) => void;
  locationsList: { id: string; name: string }[];
  onSelectLocation?: (id: string) => void;
}

export const NationalReflectionsList: React.FC<NationalReflectionsListProps> = ({
  reflections = [],
  onAddReflection,
  onUpdateReflection,
  onDeleteReflection,
  locationsList = [],
  onSelectLocation
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  const [locationFilter, setLocationFilter] = useState<string>("Semua");

  // State for Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<NationalReflectionItem | null>(null);
  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [refForm, setRefForm] = useState({
    title: '',
    category: 'Kelompok Belajar' as Reflection['category'],
    author: '',
    content: ''
  });

  // State for Delete confirmation
  const [deleteRef, setDeleteRef] = useState<NationalReflectionItem | null>(null);

  // Filter reflections
  const filteredReflections = reflections.filter(ref => {
    const matchesSearch = ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ref.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ref.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ref.locationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "Semua" || ref.category === categoryFilter;
    const matchesLocation = locationFilter === "Semua" || ref.locationId === locationFilter;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const categories: Array<Reflection['category']> = [
    'Kelompok Belajar',
    'Advokasi Kasus',
    'Kemitraan',
    'Konsolidasi Serikat',
    'Lainnya'
  ];

  const handleOpenAdd = () => {
    setEditingRef(null);
    setSelectedLocId(locationsList[0]?.id || "");
    setRefForm({
      title: '',
      category: 'Kelompok Belajar',
      author: 'Koordinator Lapangan',
      content: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ref: NationalReflectionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRef(ref);
    setSelectedLocId(ref.locationId);
    setRefForm({
      title: ref.title,
      category: ref.category,
      author: ref.author,
      content: ref.content
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refForm.title || !refForm.content || !refForm.author || !selectedLocId) {
      alert("Harap lengkapi semua isian.");
      return;
    }

    if (editingRef) {
      onUpdateReflection(editingRef.locationId, editingRef.id, {
        id: editingRef.id,
        date: editingRef.date,
        title: refForm.title,
        category: refForm.category,
        author: refForm.author,
        content: refForm.content
      });
    } else {
      onAddReflection(selectedLocId, refForm);
    }

    setIsModalOpen(false);
  };

  const handleDeleteTrigger = (ref: NationalReflectionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteRef(ref);
  };

  const confirmDelete = () => {
    if (deleteRef) {
      onDeleteReflection(deleteRef.locationId, deleteRef.id);
    }
    setDeleteRef(null);
  };

  const getCategoryColor = (cat: Reflection['category']) => {
    switch (cat) {
      case 'Kelompok Belajar':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Advokasi Kasus':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Kemitraan':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Konsolidasi Serikat':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full mt-6" id="national-reflections-tracker-panel">
      {/* Panel Header */}
      <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="font-sans font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 animate-pulse" />
            Database Refleksi & Pembelajaran Jaringan Nasional
          </h4>
          <p className="text-slate-500 text-xs font-sans mt-0.5">
            Kumpulan pembelajaran operasional, kisah sukses, dan catatan kritis dari seluruh posko wilayah jaringan kerja.
          </p>
        </div>

        {/* Add Reflection Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-amber-600" />
          Refleksi Wilayah Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tema, narasi evaluasi, penyusun, atau lokasi posko..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-sans"
          />
        </div>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600 cursor-pointer"
        >
          <option value="Semua">Semua Lokasi Posko</option>
          {locationsList.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600 cursor-pointer"
        >
          <option value="Semua">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Main Table Layout */}
      <div className="flex-1 overflow-x-auto min-h-[300px]">
        {filteredReflections.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-sans flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-amber-400" />
            <span className="text-xs font-semibold">Tidak ditemukan catatan refleksi yang cocok dengan kriteria filter.</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="p-2 md:p-4 w-16 md:w-28 text-[9px] md:text-[10px]">Ref ID</th>
                <th className="p-2 md:p-4 w-28 md:w-44 text-[9px] md:text-[10px]">Lokasi</th>
                <th className="p-2 md:p-4 text-[9px] md:text-[10px]">Tema Pembelajaran & Kutipan Refleksi Lapangan</th>
                <th className="p-2 md:p-4 w-44 text-[9px] md:text-[10px] hidden md:table-cell">Kategori Isu</th>
                <th className="p-2 md:p-4 w-36 text-[9px] md:text-[10px] hidden sm:table-cell">Penyusun</th>
                <th className="p-2 md:p-4 w-20 md:w-24 text-right text-[9px] md:text-[10px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans bg-white pb-32">
              {filteredReflections.map((ref) => (
                <tr
                  key={ref.id}
                  onClick={() => onSelectLocation && onSelectLocation(ref.locationId)}
                  className={`hover:bg-slate-50/40 transition-colors group ${
                    onSelectLocation ? 'cursor-pointer' : ''
                  }`}
                >
                  {/* Code */}
                  <td className="p-2 md:p-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-[10px]">
                      #{ref.id}
                    </span>
                  </td>

                  {/* Location Area Pin link */}
                  <td className="p-2 md:p-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-slate-800 text-xs truncate">
                          {ref.locationName}
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase font-mono font-bold leading-normal hidden sm:inline">
                          Konteks Hub
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Ref Content */}
                  <td className="p-2 md:p-4 max-w-xs sm:max-w-md">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5 md:hidden">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border ${getCategoryColor(ref.category)} whitespace-nowrap`}>
                          {ref.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[8px] text-slate-500 font-sans font-semibold sm:hidden">
                          <User className="w-2.5 h-2.5 text-slate-400" />
                          {ref.author}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs md:text-sm tracking-tight leading-tight">
                        {ref.title}
                      </span>
                      <span className="text-slate-600 text-[11px] md:text-xs font-sans line-clamp-2 md:line-clamp-3 italic bg-slate-50/60 p-2 border border-slate-100 rounded-lg mt-1 block leading-relaxed">
                        "{ref.content}"
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 font-semibold">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>
                          Diterbitkan: {new Date(ref.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category badging */}
                  <td className="p-2 md:p-4 hidden md:table-cell whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryColor(ref.category)}`}>
                      {ref.category}
                    </span>
                  </td>

                  {/* Author list info */}
                  <td className="p-2 md:p-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-700 font-bold">{ref.author}</span>
                    </div>
                  </td>

                  {/* Interactive actions block */}
                  <td className="p-2 md:p-4 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(ref, e)}
                        className="p-1 px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold flex items-center gap-1 transition-colors cursor-pointer text-[10px]"
                        title="Sunting Refleksi"
                      >
                        <Edit2 className="w-3 h-3 text-blue-500" />
                        Kelola
                      </button>

                      <button
                        onClick={(e) => handleDeleteTrigger(ref, e)}
                        className="p-1.5 rounded-lg border border-red-150 text-slate-400 hover:bg-red-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hapus Refleksi"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MASTER FORM MODAL FOR NATIONAL LEVEL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="font-sans font-bold text-slate-800 text-sm sm:text-base">
                  {editingRef ? 'Sunting Refleksi Nasional' : 'Terbitkan Refleksi Nasional Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs font-medium max-h-[80vh] overflow-y-auto">
              
              {/* Target Location / Project Pin selection */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Posko Wilayah Sasaran</label>
                <select
                  disabled={editingRef !== null}
                  value={selectedLocId}
                  onChange={(e) => setSelectedLocId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer disabled:opacity-50"
                >
                  {locationsList.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      Pelabuhan Perikanan {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Kategori Temuan</label>
                <select
                  value={refForm.category}
                  onChange={(e) => setRefForm(prev => ({ ...prev, category: e.target.value as Reflection['category'] }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Tema / Judul Evaluasi Lapangan</label>
                <input
                  type="text"
                  required
                  placeholder="Ketikkan judul refleksi yang ringkas..."
                  value={refForm.title}
                  onChange={(e) => setRefForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-slate-800"
                />
              </div>

              {/* Author */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Penyusun / Fasilitator Lapangan</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama koordinator lapangan..."
                  value={refForm.author}
                  onChange={(e) => setRefForm(prev => ({ ...prev, author: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-slate-800"
                />
              </div>

              {/* Content text */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Narasi Catatan Pelajaran Penting</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan detail refleksi, hambatan, pelajaran berharga serta solusi praktis pendampingan..."
                  value={refForm.content}
                  onChange={(e) => setRefForm(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans text-slate-800"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 border border-amber-700 text-white hover:bg-amber-700 rounded-lg transition-all text-xs font-bold cursor-pointer"
                >
                  {editingRef ? 'Simpan Perubahan' : 'Terbitkan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deleteRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-2xs" onClick={() => setDeleteRef(null)} />
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-lg p-5 max-w-sm w-full animate-in fade-in duration-100 font-sans">
            <h5 className="font-bold text-slate-800 text-sm">Hapus Rekaman Refleksi?</h5>
            <p className="text-slate-500 text-xs mt-2">
              Refleksi <strong>#{deleteRef.id}</strong> asal posko {deleteRef.locationName} akan terhapus. Tindakan ini tidak dapat diurungkan kembali.
            </p>
            <div className="flex justify-end gap-2 mt-4 font-semibold text-xs">
              <button
                onClick={() => setDeleteRef(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default NationalReflectionsList;
