import React, { useState, useRef } from 'react';
import { Beneficiary, LocationData } from '../types';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  MapPin,
  Users,
  Compass,
  Award,
  Filter,
  X,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface BeneficiariesListProps {
  beneficiaries: Beneficiary[];
  locations: LocationData[];
  onAddBeneficiary: (beneficiary: Beneficiary) => void;
  onImportBeneficiaries: (newList: Beneficiary[], overwrite: boolean) => void;
  onDeleteBeneficiary: (id: string) => void;
  onUpdateBeneficiary: (updated: Beneficiary) => void;
  isSuperAdmin?: boolean;
}

export const BeneficiariesList: React.FC<BeneficiariesListProps> = ({
  beneficiaries = [],
  locations = [],
  onAddBeneficiary,
  onImportBeneficiaries,
  onDeleteBeneficiary,
  onUpdateBeneficiary,
  isSuperAdmin = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Manual Entry Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    origin: '',
    age: '28',
    category: 'Umum' as 'Umum' | 'Champion',
    locationId: locations[0]?.id || 'muara-baru',
    notes: ''
  });

  // Import preview state
  const [importPreview, setImportPreview] = useState<Beneficiary[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics
  const filteredBeneficiaries = beneficiaries.filter(b => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHub = selectedHub === 'all' || b.locationId === selectedHub;
    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;
    return matchesSearch && matchesHub && matchesCategory;
  });

  const totals = {
    total: filteredBeneficiaries.length,
    umum: filteredBeneficiaries.filter(b => b.category === 'Umum').length,
    champions: filteredBeneficiaries.filter(b => b.category === 'Champion').length,
  };

  // Helper mapping
  const getHubName = (locId: string) => {
    const loc = locations.find(l => l.id === locId);
    return loc ? `Pelabuhan ${loc.name}` : locId;
  };

  // Download Sample Template excel
  const handleDownloadTemplate = () => {
    const data = [
      {
        "Nama (MANDATORY)": "Budi Santoso",
        "Nomor Telepon": "+62 812-3456-7890",
        "Asal (Daerah)": "Indramayu",
        "Usia": 32,
        "Kategori (Umum / Champion)": "Umum",
        "Hub ID (muara-baru / benoa / bitung)": "muara-baru",
        "Catatan": "Mengikuti sosialisasi BPJS"
      },
      {
        "Nama (MANDATORY)": "Ahmad Subarjo",
        "Nomor Telepon": "+62 813-9999-8888",
        "Asal (Daerah)": "Tegal",
        "Usia": 29,
        "Kategori (Umum / Champion)": "Champion",
        "Hub ID (muara-baru / benoa / bitung)": "bitung",
        "Catatan": "Kader Pelopor Nelayan Berdaulat"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Penerima_Manfaat");
    
    // Set column widths
    const max_width = [{ wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 8 }, { wch: 28 }, { wch: 28 }, { wch: 30 }];
    worksheet['!cols'] = max_width;

    XLSX.writeFile(workbook, "sipahak_template_penerima_manfaat.xlsx");
  };

  // File drag-over/drop upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExcelFile(file);
  };

  const processExcelFile = (file: File) => {
    setImportError(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File tidak dapat dibaca");
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet);
        if (jsonData.length === 0) {
          throw new Error("Spreadsheet kosong. Harap gunakan data sesuai template.");
        }

        const parsedBeneficiaries: Beneficiary[] = [];
        jsonData.forEach((row: any, idx: number) => {
          // Identify keys dynamically or by prefix
          const name = row["Nama (MANDATORY)"] || row["Nama"] || row["name"] || row["nama"];
          if (!name) return; // Skip invalid rows without name

          const phone = row["Nomor Telepon"] || row["No Telp"] || row["phone"] || row["telepon"] || "";
          const origin = row["Asal (Daerah)"] || row["Asal"] || row["origin"] || row["asal"] || "Indonesia";
          const age = parseInt(row["Usia"] || row["age"] || row["usia"]) || 28;
          
          let parsedCategory: 'Umum' | 'Champion' = 'Umum';
          const catStr = String(row["Kategori (Umum / Champion)"] || row["Kategori"] || row["category"] || row["kategori"] || "").toLowerCase();
          if (catStr.includes('champion') || catStr.includes('kader') || catStr.includes('pelopor')) {
            parsedCategory = 'Champion';
          }

          let parsedHub = 'muara-baru';
          const hubStr = String(row["Hub ID (muara-baru / benoa / bitung)"] || row["Hub ID"] || row["hub"] || row["Hub"] || "").toLowerCase();
          if (hubStr.includes('benoa') || hubStr.includes('bali')) {
            parsedHub = 'benoa';
          } else if (hubStr.includes('bitung') || hubStr.includes('sulawesi')) {
            parsedHub = 'bitung';
          }

          const notes = row["Catatan"] || row["catatan"] || row["notes"] || "";

          parsedBeneficiaries.push({
            id: `W-IMP-${Date.now()}-${idx}`,
            name,
            phone: String(phone),
            origin,
            age,
            category: parsedCategory,
            locationId: parsedHub,
            notes
          });
        });

        if (parsedBeneficiaries.length === 0) {
          throw new Error("Format tidak cocok. Harap periksa nama kolom template.");
        }

        setImportPreview(parsedBeneficiaries);
        setIsImporting(false);
      } catch (err: any) {
        setIsImporting(false);
        setImportError(err.message || "Gagal mengurai file Excel/CSV.");
      }
    };

    reader.onerror = () => {
      setIsImporting(false);
      setImportError("Terjadi kesalahan pembacaan berkas.");
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = (overwrite: boolean) => {
    if (importPreview.length === 0) return;
    onImportBeneficiaries(importPreview, overwrite);
    setImportPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit manual form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert("Akses Terkunci: Maaf, Anda saat ini mengakses dalam Mode Guest. Silakan login sebagai Superadmin.");
      return;
    }
    if (!formData.name) return;

    if (editingId) {
      onUpdateBeneficiary({
        id: editingId,
        name: formData.name,
        phone: formData.phone,
        origin: formData.origin,
        age: parseInt(formData.age) || 28,
        category: formData.category,
        locationId: formData.locationId,
        notes: formData.notes
      });
      setEditingId(null);
    } else {
      onAddBeneficiary({
        id: `W-MAN-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        origin: formData.origin,
        age: parseInt(formData.age) || 28,
        category: formData.category,
        locationId: formData.locationId,
        notes: formData.notes
      });
    }

    // Reset Form
    setFormData({
      name: '',
      phone: '',
      origin: '',
      age: '28',
      category: 'Umum',
      locationId: locations[0]?.id || 'muara-baru',
      notes: ''
    });
    setIsFormOpen(false);
  };

  const handleEditClick = (b: Beneficiary) => {
    setEditingId(b.id);
    setFormData({
      name: b.name,
      phone: b.phone,
      origin: b.origin,
      age: String(b.age),
      category: b.category,
      locationId: b.locationId,
      notes: b.notes
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6" id="beneficiaries-manager-section">
      
      {/* Full width cohesive modern header banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5 max-w-2xl z-10">
          <span className="text-[9px] bg-emerald-500/35 text-emerald-200 px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">
            Manajemen Basis Data Nelayan & ABK
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight text-white mt-1">
            Pekerja Perikanan yang Dijangkau
          </h2>
          <p className="text-slate-300 text-xs md:text-sm font-sans leading-relaxed">
            Direktori individu penerima manfaat program pengorganisasian. Data terdaftar disini mengalkulasi otomatis pencapaian KPI Suku Belajar, Koordinator Hub, dan Anggota Serikat secara real-time.
          </p>
        </div>

        <div className="flex gap-2.5 z-10 shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Unduh Template Excel
          </button>
          
          {isSuperAdmin && (
            <button
              onClick={() => {
                setEditingId(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Manual
            </button>
          )}
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none rounded-r-2xl" />
      </div>

      {/* KPI Overviews derived automatically from the list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="derived-metrics-grid">
        {/* Workers Reached Total */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pekerja Dijangkau</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totals.total}</span>
            <span className="text-xs text-slate-400 font-semibold">Orang terdata</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Terdistribusi di 3 Pelabuhan Pantau Utama
          </div>
        </div>

        {/* Umum */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Anggota / Umum Solosialisasi</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Compass className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totals.umum}</span>
            <span className="text-xs text-slate-400 font-semibold">{Math.round((totals.umum / (totals.total || 1)) * 100)}%</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500">
            Anggota tetap reguler sosialisasi pelabuhan harian
          </div>
        </div>

        {/* Champions / Kader */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kader Penggerak (Champion)</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totals.champions}</span>
            <span className="text-xs text-slate-400 font-semibold">{Math.round((totals.champions / (totals.total || 1)) * 100)}%</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500">
            Kader penggerak utama kelas lingkaran belajar aktif
          </div>
        </div>
      </div>

      {/* Main Container Layer: Upload Excel & Table Directory split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Import / Drag Drop Area */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-800 mb-3 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" />
              Impor File Excel atau CSV
            </h3>

            {/* Drag & Drop Area */}
            {isSuperAdmin ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <span className="block text-[11px] font-bold text-slate-600">
                  Pilih atau Seret Berkas
                </span>
                <span className="block text-[9px] text-slate-400 mt-1">
                  Format .xlsx, .xls, .csv
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-amber-205 bg-amber-50 rounded-xl p-4 text-center">
                <AlertCircle className="w-7 h-7 text-amber-500 mx-auto mb-1.5" />
                <span className="block text-[10px] font-bold text-amber-800">
                  Impor Dinonaktifkan
                </span>
                <span className="block text-[9px] text-slate-500 mt-1 leading-relaxed">
                  Fitur mengunggah spreadsheet atau menambah daftar nama dikunci untuk Guest. Hubungi admin@dfw.or.id untuk mengedit.
                </span>
              </div>
            )}

            {isImporting && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Mengurai file Excel...</span>
              </div>
            )}

            {importError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {importPreview.length > 0 && (
              <div className="mt-4 space-y-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-1.5 text-blue-900 text-xs font-bold">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Ditemukan {importPreview.length} data nelayan</span>
                </div>
                
                <p className="text-[10px] text-blue-700 leading-relaxed font-sans">
                  Sistem mendeteksi data template yang terurut. Anda dapat mengganti data sebelumnya atau menggabungkan ke data yang telah ada.
                </p>

                <div className="flex flex-col gap-2 pt-1 border-t border-blue-200/50">
                  <button
                    onClick={() => handleConfirmImport(false)}
                    className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 hover:shadow-xs transition-all text-white cursor-pointer text-center"
                  >
                    Gabungkan (+) Data Baru
                  </button>
                  <button
                    onClick={() => handleConfirmImport(true)}
                    className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-white border border-blue-200 text-blue-700 hover:bg-blue-100/50 cursor-pointer text-center"
                  >
                    Tulis Ulang (Overwrite) Seluruh Data
                  </button>
                  <button
                    onClick={() => setImportPreview([])}
                    className="w-full py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 text-center"
                  >
                    Batalkan Pengunggahan
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-400">
              <span className="block font-bold uppercase text-[9px] tracking-wider text-slate-400 mb-1">PETUNJUK IMPOR:</span>
              <p>&bull; Unduh template agar kolom ter-identifikasi otomatis.</p>
              <p>&bull; Hub ID yang sah: <code className="bg-slate-100 text-slate-600 px-1 rounded">muara-baru</code>, <code className="bg-slate-100 text-slate-600 px-1 rounded">benoa</code>, <code className="bg-slate-100 text-slate-600 px-1 rounded">bitung</code>.</p>
              <p>&bull; Kategori yang sah: <code className="bg-slate-100 text-slate-600 px-1 rounded">Umum</code> atau <code className="bg-slate-100 text-slate-600 px-1 rounded">Champion</code>.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Directory Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Filtering Tools Row */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, asal, nomor HP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-sans"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
                  <Filter className="w-3 h-3 text-slate-400" />
                  Saring Hub:
                </span>
                
                {/* Hub Selection Filter */}
                <select
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Pelabuhan Pantau</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="Umum">Umum</option>
                  <option value="Champion">Champion / Kader</option>
                </select>

                {(searchTerm || selectedHub !== 'all' || selectedCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedHub('all');
                      setSelectedCategory('all');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold shrink-0 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Directory Spreadsheet-Style Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Nama Lengkap</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Nomor Telepon</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Daerah Asal</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Usia</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Kategori</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Hub Monitor</th>
                    <th className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Catatan Khusus</th>
                    {isSuperAdmin && (
                      <th className="px-5 py-3 text-right text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBeneficiaries.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 8 : 7} className="px-5 py-10 text-center text-xs text-slate-500">
                        Tidak ada data nelayan terdaftar yang cocok dengan kriteria pencarian dan saringan.
                      </td>
                    </tr>
                  ) : (
                    filteredBeneficiaries.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-xs font-bold text-slate-900">{b.name}</td>
                        <td className="px-5 py-3 text-xs text-slate-600 font-mono font-medium">{b.phone || '-'}</td>
                        <td className="px-5 py-3 text-xs text-slate-600">{b.origin}</td>
                        <td className="px-5 py-3 text-xs text-slate-700 font-mono font-bold">{b.age} <span className="text-[10px] text-slate-400">th</span></td>
                        <td className="px-5 py-3 text-xs">
                          {b.category === 'Champion' ? (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-extrabold border border-indigo-100 uppercase tracking-wider">
                              <Award className="w-2.5 h-2.5 text-indigo-600" />
                              Champion
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 uppercase tracking-wider">
                              Umum
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {getHubName(b.locationId)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={b.notes}>{b.notes || '-'}</td>
                        {isSuperAdmin && (
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEditClick(b)}
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Sunting data"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteBeneficiary(b.id)}
                                className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Manual Entry Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Plus className="w-4 h-4 text-blue-600" />
                {editingId ? 'Edit Data Nelayan' : 'Tambah Baru Penerima Manfaat'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 font-sans text-xs">
              
              {/* Nama */}
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Andi Wijaya"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              {/* Telpon & Asal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Asal Daerah *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="Misal: Cilacap"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Usia & Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Usia Nelayan</label>
                  <input
                    type="number"
                    min="15"
                    max="80"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Kategori ABK</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'Umum' | 'Champion' })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Umum">Umum</option>
                    <option value="Champion">Champion / Kader</option>
                  </select>
                </div>
              </div>

              {/* Hub Monitor Selection */}
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1 font-sans">Sektor Hub Pesisir</label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none cursor-pointer"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>Pelabuhan {loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Catatan */}
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Catatan Keikutsertaan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informasi keterlibatan, permasalahan, atau status lingkaran belajar..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              {/* Actions Form */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg px-3.5 py-1.5 cursor-pointer font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 cursor-pointer font-bold"
                >
                  Simpan Nelayan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default BeneficiariesList;
