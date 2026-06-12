-- =========================================================================
-- DATABASE SCHEMA CONFIGURATION FOR DFW INDONESIA ORGANIZING MONITORING TOOLS
-- Cocok untuk diimpor langsung ke Supabase SQL Editor atau Sistem Database PostgreSQL Relasional
-- =========================================================================

-- Aktifkan ekstensi UUID jika dibutuhkan untuk id unik otomatis
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Wilayah / Posko Pelabuhan (Locations)
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    coordinate_x INTEGER NOT NULL DEFAULT 0,
    coordinate_y INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pada tabel wilayah
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

-- Seeding Awal Wilayah Inti
INSERT INTO locations (id, name, province, coordinate_x, coordinate_y) VALUES
('muara-baru', 'Muara Baru', 'DKI Jakarta', 30, 68),
('benoa', 'Benoa', 'Bali', 44, 78),
('bitung', 'Bitung', 'Sulawesi Utara', 74, 39)
ON CONFLICT (id) DO UPDATE SET
    coordinate_x = EXCLUDED.coordinate_x,
    coordinate_y = EXCLUDED.coordinate_y;


-- 2. Tabel Organisasi / Serikat Pekerja Pelabuhan (Organizations)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g. Serikat Buruh Sektoral, Wadah Dialog, etc.
    established INTEGER,
    members INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_location ON organizations(location_id);


-- 3. Tabel Cadre Champion (Champions)
CREATE TABLE IF NOT EXISTS champions (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Aktif',
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_champions_location ON champions(location_id);


-- 4. Tabel Dokumen Kasus & Pengaduan (Cases)
CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(50) PRIMARY KEY, -- ID Kasus format unik seperti MB-021, BA-037
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g. Gaji Tidak Dibayar, Perlindungan Sosial, dll
    status VARCHAR(50) DEFAULT 'Baru', -- Baru, Proses, Selesai
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reporter VARCHAR(150) NOT NULL,
    impact_level VARCHAR(50) DEFAULT 'Sedang', -- Rendah, Sedang, Tinggi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cases_location ON cases(location_id);
CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(category);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);


-- 5. Tabel Catatan Log Perkembangan Kasus (Case Progress Notes)
CREATE TABLE IF NOT EXISTS case_progress_notes (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(50) REFERENCES cases(id) ON DELETE CASCADE,
    date VARCHAR(50) NOT NULL, -- Menyimpan representasi tanggal catatan (e.g. "12 Juni 2026")
    note TEXT NOT NULL,
    author VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progress_case ON case_progress_notes(case_id);


-- 6. Tabel Milestone Capaian / Riwayat (Timeline Events)
CREATE TABLE IF NOT EXISTS timeline_events (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    date VARCHAR(50) NOT NULL, -- Format display e.g. "14 Feb 2026"
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- kasus, pencapaian, organisasi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timeline_location ON timeline_events(location_id);


-- 7. Tabel Catatan Refleksi dan Temuan Evaluasi (Reflections)
CREATE TABLE IF NOT EXISTS reflections (
    id VARCHAR(50) PRIMARY KEY, -- Format REF-MB-001, dll
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL, -- Advokasi Kasus, Kelompok Belajar, dll
    content TEXT NOT NULL,
    author VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reflections_location ON reflections(location_id);


-- 8. Tabel Daftar Pekerja Penerima Dampak Pendampingan (Beneficiaries)
CREATE TABLE IF NOT EXISTS beneficiaries (
    id VARCHAR(50) PRIMARY KEY, -- Kode e.g. W-001
    location_id VARCHAR(50) REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    origin VARCHAR(100),
    age INTEGER,
    category VARCHAR(50) DEFAULT 'Umum', -- Umum, Champion
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_location ON beneficiaries(location_id);


-- 9. Tabel Tren Kinerja Tahunan Nasional (National Trend)
CREATE TABLE IF NOT EXISTS national_trend (
    year INTEGER PRIMARY KEY,
    workers_reached INTEGER DEFAULT 0,
    learning_circles INTEGER DEFAULT 0,
    cases_handled INTEGER DEFAULT 0,
    cases_solved INTEGER DEFAULT 0
);

-- Seeding Data Referensi Tren Tahunan Historis (Dapat disesuaikan)
INSERT INTO national_trend (year, workers_reached, learning_circles, cases_handled, cases_solved) VALUES
(2022, 1100, 14, 45, 31),
(2023, 2150, 22, 71, 55),
(2024, 2900, 28, 92, 74),
(2025, 3500, 32, 112, 90),
(2026, 0, 0, 0, 0) -- Nilai awal 2026 kosong untuk entri real Anda
ON CONFLICT (year) DO NOTHING;
