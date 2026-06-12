import React, { useState, useEffect } from 'react';
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
  Bookmark,
  ChevronRight,
  Filter
} from 'lucide-react';

interface ReflectionsListProps {
  reflections: Reflection[];
  onAddReflection: (reflection: Omit<Reflection, 'id' | 'date'>) => void;
  onUpdateReflection?: (refId: string, updated: Reflection) => void;
  onDeleteReflection?: (refId: string) => void;
  forceOpenAddModal?: boolean;
  onResetForceAdd?: () => void;
}

export const ReflectionsList: React.FC<ReflectionsListProps> = ({
  reflections = [],
  onAddReflection,
  onUpdateReflection,
  onDeleteReflection,
  forceOpenAddModal = false,
  onResetForceAdd
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");

  // State for Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<Reflection | null>(null);
  const [refForm, setRefForm] = useState({
    title: '',
    category: 'Kelompok Belajar' as Reflection['category'],
    author: '',
    content: ''
  });

  // State for Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter reflections
  const filteredReflections = reflections.filter(ref => {
    const matchesSearch = ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ref.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ref.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ref.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "Semua" || ref.category === categoryFilter;
    return matchesSearch && matchesCategory;
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
    setRefForm({
      title: '',
      category: 'Kelompok Belajar',
      author: 'Fasilitator Lapangan',
      content: ''
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (forceOpenAddModal) {
      handleOpenAdd();
      if (onResetForceAdd) {
        onResetForceAdd();
      }
    }
  }, [forceOpenAddModal]);

  const handleOpenEdit = (ref: Reflection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRef(ref);
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
    if (!refForm.title || !refForm.content || !refForm.author) {
      alert("Harap lengkapi semua isian refleksi.");
      return;
    }

    if (editingRef && onUpdateReflection) {
      onUpdateReflection(editingRef.id, {
        ...editingRef,
        title: refForm.title,
        category: refForm.category,
        author: refForm.author,
        content: refForm.content
      });
    } else {
      onAddReflection(refForm);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId && onDeleteReflection) {
      onDeleteReflection(deleteId);
    }
    setDeleteId(null);
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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full" id="reflections-tracker-panel">
      {/* Panel Header */}
      <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="font-sans font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 animate-pulse" />
            Refleksi & Pembelajaran Lapangan
          </h4>
          <p className="text-slate-500 text-xs font-sans mt-0.5">
            Kumpulan catatan evaluatif, temuan kunci, dan pembelajaran fasilitator dalam mengawal hak awak kapal.
          </p>
        </div>

        {/* Add Reflection Button inside Header */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-150 border border-amber-200 rounded-lg shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-amber-600" />
          Refleksi Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci pembelajaran, tema, pelopor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-sans"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600 cursor-pointer"
        >
          <option value="Semua">Semua Pembelajaran</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Reflection Cards Grid / List */}
      <div className="p-4 md:p-5 flex-1 overflow-y-auto max-h-[500px] min-h-[350px] space-y-4 bg-slate-50/50">
        {filteredReflections.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-sans flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-amber-400" />
            <span className="text-xs font-semibold">Belum ada catatan refleksi yang terdaftar untuk topik ini.</span>
          </div>
        ) : (
          filteredReflections.map((ref) => (
            <div
              key={ref.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all relative flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${getCategoryColor(ref.category)}`}>
                    {ref.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{ref.id}
                  </span>
                </div>

                <h5 className="font-sans font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight leading-snug">
                  {ref.title}
                </h5>

                <p className="text-slate-600 text-xs font-sans mt-2 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  "{ref.content}"
                </p>
              </div>

              {/* Card Footer Detail */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1 text-[10px] text-slate-500 font-sans">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-700">{ref.author}</span>
                  </div>
                  <div className="flex items-center gap-1 hidden sm:flex">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(ref.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEdit(ref, e)}
                    className="p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors cursor-pointer"
                    title="Sunting Refleksi"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {onDeleteReflection && (
                    <button
                      onClick={(e) => handleDelete(ref.id, e)}
                      className="p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Hapus Refleksi"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM: ADD / EDIT REFLEXI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-sans font-bold text-slate-800 text-sm sm:text-base">
                  {editingRef ? 'Sunting Catatan Refleksi' : 'Tambah Refleksi & Pembelajaran Lapangan'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs font-medium">
              
              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600">Kategori Temuan</label>
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
                <label className="font-bold text-slate-600">Tema Refleksi / Judul Kunci</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Penggunaan Kontrak Kerja Tertulis Meningkatkan Kepatuhan BPJS ABK"
                  value={refForm.title}
                  onChange={(e) => setRefForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              {/* Author */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600">Oleh (Penyusun / Fasilitator / Koordinator)</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Sutrisno Hartono"
                  value={refForm.author}
                  onChange={(e) => setRefForm(prev => ({ ...prev, author: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              {/* Lesson Narrative content */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-600">Narasi Pembelajaran & Refleksi Kunci</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan temuan lapangan penting Anda, apa yang berhasil, hambatan apa yang dihadapi, serta pelajaran praktis bagi jejaring nasional..."
                  value={refForm.content}
                  onChange={(e) => setRefForm(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
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
                  {editingRef ? 'Simpan Perubahan' : 'Terbitkan Catatan Refleksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-2xs font-sans">
          <div className="bg-white rounded-lg border border-slate-200 shadow-lg p-5 max-w-sm w-full animate-in fade-in duration-100">
            <h5 className="font-bold text-slate-800 text-sm">Hapus Catatan Refleksi?</h5>
            <p className="text-slate-500 text-xs mt-2">Tindakan ini tidak dapat dibatalkan. Catatan pembelajaran ini akan dihapus permanen dari data wilayah.</p>
            <div className="flex justify-end gap-2 mt-4 font-semibold text-xs">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReflectionsList;
