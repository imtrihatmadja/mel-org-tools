import React, { useState } from 'react';
import { Champion } from '../types';
import {
  Award,
  PhoneCall,
  Edit2,
  Trash2,
  Plus,
  X,
  User,
  Activity,
  CheckCircle,
  HelpCircle,
  Trash,
  Check,
  AlertCircle
} from 'lucide-react';

interface ChampionsProps {
  champions: Champion[];
  onAddChampion: (champ: Champion) => void;
  onUpdateChampion: (index: number, champ: Champion) => void;
  onDeleteChampion: (index: number) => void;
}

export const ChampionsList: React.FC<ChampionsProps> = ({
  champions = [],
  onAddChampion,
  onUpdateChampion,
  onDeleteChampion
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Form states
  const [formState, setFormState] = useState({
    name: '',
    role: '',
    description: '',
    status: 'Aktif' as 'Aktif' | 'Inaktif',
    phone: ''
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormState({
      name: '',
      role: 'Kader Penggerak & Pendamping Kasus',
      description: '',
      status: 'Aktif',
      phone: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (champ: Champion, index: number) => {
    setEditingIndex(index);
    setFormState({
      name: champ.name,
      role: champ.role,
      description: champ.description,
      status: champ.status,
      phone: champ.phone || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const champData: Champion = {
      name: formState.name.trim(),
      role: formState.role.trim() || 'Kader Penggerak',
      description: formState.description.trim(),
      status: formState.status,
      phone: formState.phone.trim() || undefined
    };

    if (editingIndex !== null) {
      onUpdateChampion(editingIndex, champData);
    } else {
      onAddChampion(champData);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingIndex !== null) {
      onDeleteChampion(deletingIndex);
      setDeletingIndex(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-full" id="champions-directory-panel">
      
      {/* Header Area */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-sans font-bold text-slate-850 text-sm md:text-base">
              Direktori Kader Penggerak (Champions)
            </h4>
            <p className="text-[10px] text-slate-400 font-sans">Kelompok pelaut aktif pendamping advokasi mandiri di pelabuhan.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
            {champions.length} Aktif
          </span>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Kader
          </button>
        </div>
      </div>

      {/* Directory Cards list space */}
      <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1.5 font-sans">
        {champions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <User className="w-8 h-8 text-slate-300" />
            Tidak ada data kader penggerak terdaftar.
          </div>
        ) : (
          champions.map((champ, index) => (
            <div
              key={index}
              className="p-3.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200/60 flex flex-col gap-2.5 relative group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{champ.name}</h5>
                  <span className="text-[10px] text-indigo-600 font-semibold tracking-wide font-mono block mt-0.5 uppercase">
                    {champ.role}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                    champ.status === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {champ.status === 'Aktif' ? 'Aktif' : 'Inaktif'}
                  </span>
                  
                  {/* Action controls inside badge level */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(champ, index)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Kader"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeletingIndex(index)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Hapus Kader"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-slate-650 text-xs leading-relaxed font-normal">
                {champ.description}
              </p>

              {champ.phone && (
                <div className="flex items-center justify-between mt-0.5 pt-2 border-t border-slate-200/40 text-[10px] text-slate-400 font-sans">
                  <span className="flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-slate-400" />
                    Hubungi Kontak:
                  </span>
                  <span className="font-bold text-indigo-600 hover:underline">{champ.phone}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* POPUP FORM ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white border border-slate-250 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 font-sans">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                {editingIndex !== null ? 'Sunting Berkas Kader' : 'Tambah Kader Penggerak Baru'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap Kader *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sutrisno Hartono"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jabatan / Peran Lapangan</label>
                  <input
                    type="text"
                    placeholder="Misal: Konselor Kasus"
                    value={formState.role}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Keaktifan</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as 'Aktif' | 'Inaktif' })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    <option value="Aktif">Aktif Mendampingi</option>
                    <option value="Inaktif">Inaktif / Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor Kontak (WhatsApp / HP)</label>
                <input
                  type="text"
                  placeholder="+62 8xx-xxxx-xxxx"
                  value={formState.phone}
                  onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                  className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-indigo-700 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Profil & Riwayat Singkat</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Deskripsikan latar belakang (misal: mantan ABK aktif melakukan pembinaan lingkaran belajar)..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full text-xs font-semibold focus:font-medium border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-700 bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer shadow-xs transition-all flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Selesai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setDeletingIndex(null)} />
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full p-5 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">Konfirmasi Hapus Kader</h4>
                <p className="text-xs text-slate-500 leading-normal font-sans">
                  Apakah Anda yakin ingin menghapus berkas kader <strong className="text-slate-800">"{champions[deletingIndex]?.name}"</strong>? Data kader tidak akan terasosiasi dengan kegiatan posko di halaman ini lagi.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4 font-sans">
              <button
                type="button"
                onClick={() => setDeletingIndex(null)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-650 hover:bg-rose-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer transition-colors"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ChampionsList;
