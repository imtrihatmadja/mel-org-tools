import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Upload, 
  Trash2, 
  Plus, 
  X, 
  Users, 
  Activity, 
  FileText, 
  Check, 
  Map, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { LocationData, AreaMapPin } from '../types';
import { supabase } from '../lib/supabase';

interface LocalHubMapProps {
  location: LocationData;
  onUpdateLocation: (updated: LocationData) => void;
  isSuperAdmin: boolean;
  currentUserEmail?: string;
}

export default function LocalHubMap({ location, onUpdateLocation, isSuperAdmin, currentUserEmail }: LocalHubMapProps) {
  const [loadedMapImage, setLoadedMapImage] = useState<string | undefined>(undefined);
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  useEffect(() => {
    // 1. Ambil dari cache localStorage secepatnya agar instan (zero flicker)
    const cached = localStorage.getItem(`DFW_MAP_IMAGE_${location.id}`);
    setLoadedMapImage(cached || undefined);

    // 2. Muat dari Supabase secara lazy / on-demand pasca komponen di-mount atau berganti wilayah
    if (supabase) {
      setIsLoadingMap(true);
      supabase.from('reflections')
        .select('content')
        .eq('location_id', location.id)
        .eq('category', 'PETA_KUSTOM')
        .maybeSingle()
        .then(({ data, error }) => {
          setIsLoadingMap(false);
          if (!error && data?.content) {
            setLoadedMapImage(data.content);
            localStorage.setItem(`DFW_MAP_IMAGE_${location.id}`, data.content);
          } else if (error) {
            console.error("Gagal memuat peta kustom secara dinamis dari Supabase:", error);
          } else if (!data) {
            // Jika di Supabase benar kosong tapi di cache ada, berarti peta telah dihapus dari tempat lain
            if (!cached) {
              setLoadedMapImage(undefined);
            }
          }
        });
    }
  }, [location.id]);

  const [isAddingPin, setIsAddingPin] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [activePin, setActivePin] = useState<AreaMapPin | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields for New Pin
  const [pinLabel, setPinLabel] = useState('');
  const [pinWorkers, setPinWorkers] = useState<number>(0);
  const [pinActivity, setPinActivity] = useState('');
  const [pinNotes, setPinNotes] = useState('');

  // Handle uploading custom map image
  const handleMapImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar! Silakan gunakan file berukuran di bawah 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpdateLocation({
          ...location,
          customMapImage: base64String
        });
        
        // Simpan ke localStorage agar tidak ter-reset
        localStorage.setItem(`DFW_MAP_IMAGE_${location.id}`, base64String);
        setLoadedMapImage(base64String);

        // Simpan ke Supabase jika login
        if (supabase) {
          supabase.from('reflections').upsert({
            id: `PETA-${location.id}`,
            location_id: location.id,
            title: `PETA_KUSTOM_${location.id}`,
            category: 'PETA_KUSTOM',
            content: base64String,
            author: 'Sistem Geospasial'
          }).then(({ error }) => {
            if (error) console.error("Gagal menyimpan peta kustom ke Supabase:", error);
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file selection input
  const triggerFileDialog = () => {
    if (!isSuperAdmin) {
      alert("Hanya pengguna terotentikasi (Admin) yang dapat mengunggah peta kustom!");
      return;
    }
    fileInputRef.current?.click();
  };

  // Remove uploaded map and revert to default blueprint grid
  const handleRemoveMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus peta kustom ini dan kembali ke tampilan skematik standar?")) {
      return;
    }
    onUpdateLocation({
      ...location,
      customMapImage: undefined
    });
    localStorage.removeItem(`DFW_MAP_IMAGE_${location.id}`);
    setLoadedMapImage(undefined);

    // Hapus di Supabase jika login
    if (supabase) {
      supabase.from('reflections').delete().match({
        location_id: location.id,
        category: 'PETA_KUSTOM'
      }).then(({ error }) => {
        if (error) console.error("Gagal menghapus peta kustom di Supabase:", error);
      });
    }
  };

  // Capture coordinate percentage relative to map container size on click
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If user clicked inside an existing pin icon or active pin card, don't trigger new pin creation
    const target = e.target as HTMLElement;
    if (target.closest('.map-pin-bullet') || target.closest('.pin-popup-card')) {
      return;
    }

    if (!isSuperAdmin) {
      return; // Guest cannot place pins
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat((( (e.clientX - rect.left) / rect.width ) * 100).toFixed(1));
    const y = parseFloat((( (e.clientY - rect.top) / rect.height ) * 100).toFixed(1));

    setClickCoords({ x, y });
    setIsAddingPin(true);
    
    // Autofill / Reset form values
    setPinLabel(`Titik Sektor ${((location.mapPins?.length || 0) + 1)}`);
    setPinWorkers(15);
    setPinActivity('Sosialisasi hak ketenagakerjaan dan jaminan perlindungan BPJS Ketenagakerjaan bagi ABK.');
    setPinNotes('ABK antusias bertanya perihal tata cara klaim kecelakaan kerja darurat.');
  };

  // Save changes to database / states
  const handleSavePin = () => {
    if (!pinLabel.trim()) {
      alert("Masukkan nama label titik aktivitas!");
      return;
    }

    if (!clickCoords) return;

    const newPin: AreaMapPin = {
      id: `pin-${Date.now()}`,
      x: clickCoords.x,
      y: clickCoords.y,
      label: pinLabel,
      workersReached: pinWorkers || 0,
      activity: pinActivity || 'Aktivitas pengorganisasian',
      progressNotes: pinNotes || '',
      createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdBy: currentUserEmail || 'admin@dfw.or.id'
    };

    const updatedPins = [...(location.mapPins || []), newPin];
    
    // Save state
    const updatedLocation = {
      ...location,
      mapPins: updatedPins
    };
    
    onUpdateLocation(updatedLocation);
    localStorage.setItem(`DFW_MAP_PINS_${location.id}`, JSON.stringify(updatedPins));

    // Simpan ke Supabase jika login
    if (supabase) {
      supabase.from('reflections').upsert({
        id: `PINS-${location.id}`,
        location_id: location.id,
        title: `PETA_PINS_${location.id}`,
        category: 'PETA_PIN',
        content: JSON.stringify(updatedPins),
        author: 'Sistem Geospasial'
      }).then(({ error }) => {
        if (error) console.error("Gagal menyimpan pin peta ke Supabase:", error);
      });
    }

    // Reset status
    setIsAddingPin(false);
    setClickCoords(null);
  };

  const handleDeletePin = (pinId: string) => {
    if (!confirm("Hapus titik aktivitas di lokasi ini?")) return;

    const filteredPins = (location.mapPins || []).filter(p => p.id !== pinId);
    
    const updatedLocation = {
      ...location,
      mapPins: filteredPins
    };

    onUpdateLocation(updatedLocation);
    localStorage.setItem(`DFW_MAP_PINS_${location.id}`, JSON.stringify(filteredPins));

    // Simpan ke Supabase jika login
    if (supabase) {
      if (filteredPins.length === 0) {
        supabase.from('reflections').delete().match({
          location_id: location.id,
          category: 'PETA_PIN'
        }).then(({ error }) => {
          if (error) console.error("Gagal menghapus pin peta di Supabase:", error);
        });
      } else {
        supabase.from('reflections').upsert({
          id: `PINS-${location.id}`,
          location_id: location.id,
          title: `PETA_PINS_${location.id}`,
          category: 'PETA_PIN',
          content: JSON.stringify(filteredPins),
          author: 'Sistem Geospasial'
        }).then(({ error }) => {
          if (error) console.error("Gagal mengupdate pin peta di Supabase:", error);
        });
      }
    }

    if (activePin?.id === pinId) {
      setActivePin(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden mb-8" id="local-hub-map-card">
      
      {/* Top Card Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider font-sans">
              Geospasial Hub
            </span>
            <span className="text-[10px] text-slate-450">&bull; Pemetaan Skala Mikro</span>
          </div>
          <h4 className="font-extrabold text-sm md:text-base text-slate-900 uppercase mt-0.5 tracking-tight flex items-center gap-1.5 font-sans">
            <Map className="w-4 h-4 text-indigo-600" />
            Peta Geospasial Pendampingan & Aktivitas Lapangan ({location.name})
          </h4>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {loadedMapImage && (
            <button
              onClick={handleRemoveMap}
              className="px-2.5 py-1.5 border border-red-200 rounded-lg text-[11px] font-bold text-red-600 bg-red-50/50 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer flex items-center gap-1"
              title="Hapus gambar peta dan gunakan grid skematik"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Peta
            </button>
          )}

          <button
            onClick={triggerFileDialog}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 hover:shadow-xs rounded-lg text-[11px] font-bold text-white transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
          >
            <Upload className="w-3.5 h-3.5" />
            {loadedMapImage ? 'Ganti Peta Kustom' : 'Unggah Peta Kustom'}
          </button>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleMapImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="p-5 font-sans">
        
        {/* Map Stage Frame */}
        <div className="relative mb-6">
          <div 
            onClick={handleMapClick}
            className={`w-full min-h-[380px] md:min-h-[460px] max-h-[640px] bg-slate-950 border border-slate-200/90 rounded-2xl overflow-hidden relative shadow-inner select-none ${
              isSuperAdmin ? 'cursor-crosshair' : 'cursor-default'
            }`}
          >
            {/* Loading Indicator */}
            {isLoadingMap && !loadedMapImage && (
              <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-slate-300 gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                <span className="text-[11px] font-medium tracking-wide">Memuat Peta Terenkripsi...</span>
              </div>
            )}

            {/* Custom Map or Default Blueprint */}
            {loadedMapImage ? (
              <img 
                src={loadedMapImage} 
                className="w-full h-full min-h-[380px] md:min-h-[460px] object-cover pointer-events-none" 
                alt={`Peta zonasi lapangan ${location.name}`} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                {/* Schematic lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40"></div>
                
                {/* Blueprint Waterway Circular Rings */}
                <div className="absolute w-[220px] h-[220px] rounded-full border border-indigo-500/10 animate-pulse duration-[3s]"></div>
                <div className="absolute w-[440px] h-[440px] rounded-full border border-indigo-500/10"></div>
                <div className="absolute w-[660px] h-[660px] rounded-full border border-indigo-500/5"></div>
                
                <span className="absolute top-3 left-3 font-mono text-[9px] uppercase text-slate-550">RADAR: DFW-{location.id.toUpperCase()}-SECTOR</span>
                <span className="absolute bottom-3 right-3 font-mono text-[9px] uppercase text-slate-550">GRID: MERCATOR // COORD_PETA</span>

                <div className="relative z-10 flex flex-col items-center max-w-md">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-indigo-500/30 flex items-center justify-center mb-3">
                    <Map className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest leading-6">Peta Lapangan Posko Belum Diunggah</h5>
                  <p className="text-[11px] text-slate-450 leading-relaxed max-w-sm mt-1">
                    Silakan unggah foto tangkapan layar berupa peta Google Maps, zonasi dermaga, atau layout satelit dari area <strong className="text-indigo-300 font-bold">{location.name}</strong> untuk penempatan titik aktivitas yang lebih akurat.
                  </p>
                  <p className="text-[10px] text-indigo-400/90 bg-indigo-950/40 px-3 py-1 rounded-sm border border-indigo-900/40 mt-4 leading-relaxed font-semibold">
                    💡 Anda tetap dapat mengeklik area grid ini sekarang untuk menempatkan titik simulasi.
                  </p>
                </div>
              </div>
            )}

            {/* Instruction tooltip overlay card */}
            {isSuperAdmin && !loadedMapImage && (
              <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-xs border border-slate-800 text-[10px] font-sans text-slate-305 px-3 py-1.5 rounded-lg max-w-[240px] pointer-events-none">
                <span className="text-amber-450 font-bold">🎯 Mode Monitor Admin:</span> Klik di mana saja pada layar ini untuk memasang pin penjangkauan pekerja!
              </div>
            )}

            {/* Render Map Pins (placed dynamically horizontally and vertically in percentages) */}
            {(location.mapPins || []).map((pin, index) => {
              const isActive = activePin?.id === pin.id;
              return (
                <div 
                  key={pin.id}
                  className="absolute"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                >
                  {/* Pin Circle bullet */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePin(isActive ? null : pin);
                    }}
                    className="map-pin-bullet w-7 h-7 rounded-full bg-indigo-600 hover:bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center relative -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform transform hover:scale-125 z-20 group"
                    title={pin.label}
                  >
                    <MapPin className="w-3.5 h-3.5 text-white" />
                    
                    {/* Pulsing ring */}
                    <span className="absolute -inset-1 rounded-full border border-indigo-400 opacity-60 animate-ping group-hover:border-emerald-400 pointer-events-none" />
                    
                    {/* Index tooltip label */}
                    <span className="absolute hidden group-hover:block bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap font-bold shadow-md uppercase">
                      {pin.label}
                    </span>
                  </button>

                  {/* Pin details hovering card */}
                  {isActive && (
                    <div className="pin-popup-card absolute bottom-6 left-0 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-72 md:w-80 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="flex items-start justify-between pb-1.5 border-b border-slate-100 mb-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-indigo-500" />
                          <h6 className="font-extrabold text-xs text-slate-905 uppercase">{pin.label}</h6>
                        </div>
                        <button
                          onClick={() => setActivePin(null)}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2 text-xs text-slate-700">
                        <div className="flex items-center justify-between text-[11px] bg-indigo-50/70 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            Pekerja Dijangkau:
                          </span>
                          <span className="font-mono text-sm">{pin.workersReached} Org</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Aktivitas Utama:</span>
                          <p className="text-[11px] bg-slate-50 border border-slate-150/60 p-2 rounded-lg leading-relaxed mt-0.5 font-medium">
                            {pin.activity}
                          </p>
                        </div>

                        {pin.progressNotes?.trim() && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Catatan Perkembangan:</span>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed pl-1.5 border-l-2 border-slate-200">
                              {pin.progressNotes}
                            </p>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg leading-relaxed flex items-center gap-1.5 border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          <span>Petugas Penginput: <strong className="font-bold text-slate-700">{pin.createdBy || 'Petugas Lapangan'}</strong></span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-405 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Tgl Pasang: {pin.createdAt}
                          </span>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeletePin(pin.id)}
                              className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Clicked coordinates pointer indicator when form is open */}
            {isAddingPin && clickCoords && (
              <div 
                className="absolute z-20 pointer-events-none"
                style={{ left: `${clickCoords.x}%`, top: `${clickCoords.y}%` }}
              >
                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-indigo-500 opacity-75" />
                  <div className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-md">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Form for Adding a New Pin overlay dialog */}
        {isAddingPin && clickCoords && (
          <div className="bg-indigo-50/50 border-2 border-indigo-100 rounded-xl p-4 mb-6 relative animate-in fade-in slide-in-from-top-3 duration-200">
            <button 
              onClick={() => { setIsAddingPin(false); setClickCoords(null); }}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h5 className="font-extrabold text-xs text-indigo-900 uppercase tracking-widest flex items-center gap-2 mb-3.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              FORMULIR PENINGKATAN TITIK PENGORGANISASIAN (X: {clickCoords.x}%, Y: {clickCoords.y}%)
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Field 1: Label Titik */}
              <div className="md:col-span-4">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Nama Titik Sektor / Bidang Kerja *
                </label>
                <input 
                  type="text"
                  required
                  value={pinLabel}
                  onChange={(e) => setPinLabel(e.target.value)}
                  placeholder="Contoh: Dermaga Barat II"
                  className="w-full text-xs px-3 py-2 border border-slate-250 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
                />
              </div>

              {/* Field 2: Workers Reached */}
              <div className="md:col-span-3">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Jumlah ABK di Hub Titik Ini
                </label>
                <input 
                  type="number"
                  min="0"
                  value={pinWorkers}
                  onChange={(e) => setPinWorkers(parseInt(e.target.value) || 0)}
                  placeholder="Contoh: 15"
                  className="w-full text-xs px-3 py-2 border border-slate-250 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono"
                />
              </div>

              {/* Field 3: Activity */}
              <div className="md:col-span-5">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Aktivitas Kunci Yang Dilakukan *
                </label>
                <input 
                  type="text"
                  required
                  value={pinActivity}
                  onChange={(e) => setPinActivity(e.target.value)}
                  placeholder="Contoh: Edukasi regulasi kontrak laut kerja"
                  className="w-full text-xs px-3 py-2 border border-slate-250 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              {/* Field 4: Progress Comments */}
              <div className="md:col-span-12">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Catatan Perkembangan Lapangan (Progress Notes)
                </label>
                <textarea 
                  value={pinNotes}
                  onChange={(e) => setPinNotes(e.target.value)}
                  placeholder="Ceritakan detail perkembangan, kendala, temuan, atau dokumen pemicu di pos ini..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-slate-250 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800 leading-relaxed font-sans"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 mt-3.5 pt-3.5 border-t border-indigo-100">
              <button
                type="button"
                onClick={() => { setIsAddingPin(false); setClickCoords(null); }}
                className="px-3 py-1.5 border border-slate-250 text-slate-455 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePin}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan & Tandai Peta
              </button>
            </div>
          </div>
        )}

        {/* Warning hint when guest tries to touch map */}
        {!isSuperAdmin && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100 hover:bg-slate-150/40 text-slate-600 border border-slate-200 text-xs text-left mb-4">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Tampilan Peta dalam status <strong>Tamu / Terbatas</strong>. Menambahkan ataupun memodifikasi titik koordinat pin pada peta melingkar hanya dapat diakses oleh Admin berwenang DFW Indonesia.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
