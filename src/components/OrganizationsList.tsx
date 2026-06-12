import React, { useState } from 'react';
import { WorkerOrganization } from '../types';
import {
  Building2,
  Compass,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  Check,
  AlertCircle
} from 'lucide-react';

interface OrganizationsProps {
  organizations: WorkerOrganization[];
  onAddOrganization: (org: WorkerOrganization) => void;
  onUpdateOrganization: (index: number, org: WorkerOrganization) => void;
  onDeleteOrganization: (index: number) => void;
}

export const OrganizationsList: React.FC<OrganizationsProps> = ({
  organizations = [],
  onAddOrganization,
  onUpdateOrganization,
  onDeleteOrganization
}) => {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Form states
  const [formState, setFormState] = useState({
    name: '',
    type: 'Fasilitas Serikat Pekerja Mandiri',
    established: 2020,
    members: 100
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormState({
      name: '',
      type: 'Fasilitas Serikat Pekerja Mandiri',
      established: new Date().getFullYear() - 2,
      members: 50
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (org: WorkerOrganization, index: number) => {
    setEditingIndex(index);
    setFormState({
      name: org.name,
      type: org.type,
      established: org.established,
      members: org.members
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const orgData: WorkerOrganization = {
      name: formState.name.trim(),
      type: formState.type.trim(),
      established: Number(formState.established) || 2020,
      members: Number(formState.members) || 0
    };

    if (editingIndex !== null) {
      onUpdateOrganization(editingIndex, orgData);
    } else {
      onAddOrganization(orgData);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingIndex !== null) {
      onDeleteOrganization(deletingIndex);
      setDeletingIndex(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-full" id="organizations-directory-panel">
      
      {/* Header Area */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-sans font-bold text-slate-850 text-sm md:text-base">
              Serikat & Forum Awak Kapal Mitra Kerja
            </h4>
            <p className="text-[10px] text-slate-400 font-sans">Organisasi atau komite pelaut yang bermitra dalam pembelaan hak.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-100 text-slate-650 px-2.5 py-1 rounded-full font-bold">
            {organizations.length} Terdaftar
          </span>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Serikat
          </button>
        </div>
      </div>

      {/* List Area */}
      <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1.5 font-sans">
        {organizations.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Building2 className="w-8 h-8 text-slate-300" />
            Belum ada serikat mitra kerja terdaftar di area ini.
          </div>
        ) : (
          organizations.map((org, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-dashed border-slate-300 hover:border-indigo-200 hover:bg-slate-50/50 transition-all flex flex-col justify-between gap-3 relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <h5 className="font-bold text-slate-950 text-xs sm:text-sm">{org.name}</h5>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-sm shrink-0 font-extrabold uppercase">
                      {org.type}
                    </span>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(org, index)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Serikat"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeletingIndex(index)}
                        className="p-1 rounded text-slate-400 hover:text-red-650 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Hapus Serikat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-450" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-medium">Tahun Berdiri</span>
                      <span className="font-bold text-slate-800">{org.established}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-500">
                    <Compass className="w-4 h-4 text-slate-450" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-medium font-sans">Kekuatan Anggota</span>
                      <span className="font-extrabold text-indigo-700">{org.members.toLocaleString()} ABK</span>
                    </div>
                  </div>
                </div>
              </div>
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
                <Building2 className="w-4 h-4 text-indigo-600" />
                {editingIndex !== null ? 'Sunting Berkas Serikat Mitra' : 'Tambah Serikat / Forum Mitra Kerja'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Serikat / Forum Kerja *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Serikat Pekerja Perikanan Hub Bali"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori / Jenis Serikat</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Afiliasi SP Mandiri, Forum Komite Pelaut, Komunitas Mitra"
                  value={formState.type}
                  onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tahun Didirikan</label>
                  <input
                    type="number"
                    min="1950"
                    max="2030"
                    required
                    value={formState.established}
                    onChange={(e) => setFormState({ ...formState, established: Number(e.target.value) })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kapasitas Anggota (Jiwa)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formState.members}
                    onChange={(e) => setFormState({ ...formState, members: Number(e.target.value) })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">Konfirmasi Hapus Serikat</h4>
                <p className="text-xs text-slate-500 leading-normal font-sans">
                  Apakah Anda yakin ingin menghapus berkas serikat pekerja/forum <strong className="text-slate-800">"{organizations[deletingIndex]?.name}"</strong>? Data ini akan terhapus secara permanen dan merekonsiliasi statistik keanggotaan.
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
export default OrganizationsList;
