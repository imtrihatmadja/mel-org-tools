import React, { useState, useEffect } from 'react';
import { LocationData, LocationStats } from '../types';
import {
  X,
  Save,
  Plus,
  Edit2,
  Users,
  Compass,
  Award,
  Activity,
  CheckSquare,
  Building2,
  Bookmark
} from 'lucide-react';

interface KPIEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationData[];
  onSave: (locationId: string, updatedStats: LocationStats, actionType: 'edit' | 'tambah') => void;
  initialLocationId: string | null;
}

export const KPIEditModal: React.FC<KPIEditModalProps> = ({
  isOpen,
  onClose,
  locations,
  onSave,
  initialLocationId
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>('');
  const [method, setMethod] = useState<'edit' | 'tambah'>('edit');
  
  // Form input states
  const [workersReached, setWorkersReached] = useState<string>('0');
  const [activeLearningCircles, setActiveLearningCircles] = useState<string>('0');
  const [circleParticipants, setCircleParticipants] = useState<string>('0');
  const [championsCount, setChampionsCount] = useState<string>('0');
  const [organizationMembers, setOrganizationMembers] = useState<string>('0');
  const [casesCount, setCasesCount] = useState<string>('0');
  const [casesSolved, setCasesSolved] = useState<string>('0');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selected location when modal opens or initialLocationId changes
  useEffect(() => {
    if (initialLocationId) {
      setSelectedLocId(initialLocationId);
    } else if (locations.length > 0 && !selectedLocId) {
      setSelectedLocId(locations[0].id);
    }
  }, [initialLocationId, locations, isOpen]);

  // Load current values when selecting a location or switching method
  useEffect(() => {
    const loc = locations.find(l => l.id === selectedLocId);
    if (loc) {
      if (method === 'edit') {
        // Overwrite mode loads current values
        setWorkersReached(String(loc.stats.workersReached));
        setActiveLearningCircles(String(loc.stats.activeLearningCircles));
        setCircleParticipants(String(loc.stats.circleParticipants));
        setChampionsCount(String(loc.stats.championsCount));
        setOrganizationMembers(String(loc.stats.organizationMembers));
        setCasesCount(String(loc.stats.casesCount));
        setCasesSolved(String(loc.stats.casesSolved));
      } else {
        // Add mode resets to 0 so they can specify the increment
        setWorkersReached('0');
        setActiveLearningCircles('0');
        setCircleParticipants('0');
        setChampionsCount('0');
        setOrganizationMembers('0');
        setCasesCount('0');
        setCasesSolved('0');
      }
      setErrorMessage(null);
    }
  }, [selectedLocId, method, locations, isOpen]);

  if (!isOpen) return null;

  const activeLoc = locations.find(l => l.id === selectedLocId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Parse values to numbers
    const numWorkers = Math.max(0, parseInt(workersReached) || 0);
    const numCircles = Math.max(0, parseInt(activeLearningCircles) || 0);
    const numParticipants = Math.max(0, parseInt(circleParticipants) || 0);
    const numChampions = Math.max(0, parseInt(championsCount) || 0);
    const numMembers = Math.max(0, parseInt(organizationMembers) || 0);
    const numCases = Math.max(0, parseInt(casesCount) || 0);
    const numSolved = Math.max(0, parseInt(casesSolved) || 0);

    // Validation
    if (method === 'edit') {
      if (numSolved > numCases) {
        setErrorMessage('Kesalahan Regulasi Kasus: Jumlah kasus yang diselesaikan tidak boleh melebihi total aduan kasus yang masuk.');
        return;
      }
    } else {
      // In additions mode
      const currentLoc = locations.find(l => l.id === selectedLocId);
      if (currentLoc) {
        const checkTotalCases = currentLoc.stats.casesCount + numCases;
        const checkTotalSolved = currentLoc.stats.casesSolved + numSolved;
        if (checkTotalSolved > checkTotalCases) {
          setErrorMessage(`Kesalahan Regulasi Kasus: Akumulasi penyelesaiaan (${checkTotalSolved} kasus) tidak boleh melampaui akumulasi total aduan (${checkTotalCases} kasus).`);
          return;
        }
      }
    }

    // Prepare update payload
    const updatedStats: LocationStats = {
      workersReached: numWorkers,
      activeLearningCircles: numCircles,
      circleParticipants: numParticipants,
      championsCount: numChampions,
      organizationMembers: numMembers,
      casesCount: numCases,
      casesSolved: numSolved,
      casesPending: Math.max(0, numCases - numSolved) // Standard initial calculate
    };

    onSave(selectedLocId, updatedStats, method);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="kpi-edit-modal-overlay">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card Box */}
      <div className="relative bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <Plus className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Kelola & Perbarui Data Capaian (KPI)
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Pencatatan perkembangan sosialisasi dan kemitraan pelabuhan
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Action Type Mode & Location Select Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hub Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pilih Jaringan Kerja (Hub)
              </label>
              <select
                value={selectedLocId}
                onChange={(e) => setSelectedLocId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    Pelabuhan Perikanan {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editing / Updating Mode Toggle Option */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Metode Entri Data
              </label>
              <div className="grid grid-cols-2 bg-slate-100 border border-slate-200/50 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMethod('edit')}
                  className={`flex items-center justify-center gap-1.5 py-1 px-2.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    method === 'edit'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Edit2 className="w-3 h-3 text-blue-600" />
                  Sunting Data
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('tambah')}
                  className={`flex items-center justify-center gap-1.5 py-1 px-2.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    method === 'tambah'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Plus className="w-3 h-3 text-emerald-600" />
                  Tambah (+)
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[11px] text-slate-500 leading-relaxed font-sans mb-2">
            {method === 'edit' ? (
              <span>Mengisi form di bawah akan <strong>menimpa secara langsung (Overwrite)</strong> angka capaian KPI terpilih saat ini. Cocok untuk mengoreksi kesalahan entri laporan.</span>
            ) : (
              <span>Mengisi form di bawah akan <strong>diakumulasikan atau dijumlahkan (+)</strong> ke angka pendataan yang sudah ada saat ini. Berguna jika Anda ingin melaporkan kegiatan/sosialisasi baru hari ini.</span>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Form input fields */}
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            
            {/* Workers Reached */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
                  <Users className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-700 leading-tight">Pekerja Dijangkau</span>
                  <span className="text-[10px] text-slate-400">Total sosialisasi pelabuhan</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'tambah' && <span className="text-xs text-emerald-600 font-bold font-mono">+</span>}
                <input
                  type="number"
                  min="0"
                  value={workersReached}
                  onChange={(e) => setWorkersReached(e.target.value)}
                  className="w-24 text-right bg-white border border-slate-200/90 rounded px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                {method === 'tambah' && activeLoc && (
                  <span className="text-[9px] text-slate-400 font-semibold font-mono w-14 truncate">
                    (Semula: {activeLoc.stats.workersReached})
                  </span>
                )}
              </div>
            </div>

            {/* Learning Circles */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded">
                  <Compass className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-700 leading-tight">Lingkaran Belajar Aktif</span>
                  <span className="text-[10px] text-slate-400">Jumlah hub kelompok belajar</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'tambah' && <span className="text-xs text-emerald-600 font-bold font-mono">+</span>}
                <input
                  type="number"
                  min="0"
                  value={activeLearningCircles}
                  onChange={(e) => setActiveLearningCircles(e.target.value)}
                  className="w-24 text-right bg-white border border-slate-200/90 rounded px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                {method === 'tambah' && activeLoc && (
                  <span className="text-[9px] text-slate-400 font-semibold font-mono w-14">
                    (Semula: {activeLoc.stats.activeLearningCircles})
                  </span>
                )}
              </div>
            </div>

            {/* Circle Participants */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-50/70 text-amber-600 rounded">
                  <Bookmark className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-700 leading-tight">Peserta Lingkaran Belajar</span>
                  <span className="text-[10px] text-slate-400">Peserta tetap reguler aktif</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'tambah' && <span className="text-xs text-emerald-600 font-bold font-mono">+</span>}
                <input
                  type="number"
                  min="0"
                  value={circleParticipants}
                  onChange={(e) => setCircleParticipants(e.target.value)}
                  className="w-24 text-right bg-white border border-slate-200/90 rounded px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                {method === 'tambah' && activeLoc && (
                  <span className="text-[9px] text-slate-400 font-semibold font-mono w-14">
                    (Semula: {activeLoc.stats.circleParticipants})
                  </span>
                )}
              </div>
            </div>

            {/* Champions Count */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                  <Award className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-700 leading-tight">Kader Penggerak (Champions)</span>
                  <span className="text-[10px] text-slate-400">ABK Pelopor aktif terlatih</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'tambah' && <span className="text-xs text-emerald-600 font-bold font-mono">+</span>}
                <input
                  type="number"
                  min="0"
                  value={championsCount}
                  onChange={(e) => setChampionsCount(e.target.value)}
                  className="w-24 text-right bg-white border border-slate-200/90 rounded px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                {method === 'tambah' && activeLoc && (
                  <span className="text-[9px] text-slate-400 font-semibold font-mono w-14">
                    (Semula: {activeLoc.stats.championsCount})
                  </span>
                )}
              </div>
            </div>

            {/* Union Members */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-sky-50 text-sky-600 rounded">
                  <Activity className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-700 leading-tight">Anggota Serikat Terorganisir</span>
                  <span className="text-[10px] text-slate-400">Terdaftar di serikat mitra kerja</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'tambah' && <span className="text-xs text-emerald-600 font-bold font-mono">+</span>}
                <input
                  type="number"
                  min="0"
                  value={organizationMembers}
                  onChange={(e) => setOrganizationMembers(e.target.value)}
                  className="w-24 text-right bg-white border border-slate-200/90 rounded px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                {method === 'tambah' && activeLoc && (
                  <span className="text-[9px] text-slate-400 font-semibold font-mono w-14">
                    (Semula: {activeLoc.stats.organizationMembers})
                  </span>
                )}
              </div>
            </div>

            {/* Cases Count */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-50 text-rose-500 rounded">
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-700 leading-tight">Total Laporan Aduan</span>
                  <span className="text-[10px] text-slate-400">Kumulasi pengaduan masuk</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'tambah' && <span className="text-xs text-emerald-600 font-bold font-mono">+</span>}
                <input
                  type="number"
                  min="0"
                  value={casesCount}
                  onChange={(e) => setCasesCount(e.target.value)}
                  className="w-24 text-right bg-white border border-slate-200/90 rounded px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                {method === 'tambah' && activeLoc && (
                  <span className="text-[9px] text-slate-400 font-semibold font-mono w-14">
                    (Semula: {activeLoc.stats.casesCount})
                  </span>
                )}
              </div>
            </div>

            {/* Cases Solved */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
                  <CheckSquare className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-700 leading-tight">Kasus Selesai</span>
                  <span className="text-[10px] text-slate-400">Aduan dengan penyelesaian tuntas</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method === 'tambah' && <span className="text-xs text-emerald-600 font-bold font-mono">+</span>}
                <input
                  type="number"
                  min="0"
                  value={casesSolved}
                  onChange={(e) => setCasesSolved(e.target.value)}
                  className="w-24 text-right bg-white border border-slate-200/90 rounded px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                {method === 'tambah' && activeLoc && (
                  <span className="text-[9px] text-slate-400 font-semibold font-mono w-14">
                    (Semula: {activeLoc.stats.casesSolved})
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg px-4 py-2 text-xs font-bold cursor-pointer transition-colors"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xs transition-all cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
export default KPIEditModal;
