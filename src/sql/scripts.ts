export interface SqlScript {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const SQL_SCRIPTS: SqlScript[] = [
  {
    id: '01_schema',
    name: '01_schema.sql',
    description: 'PostgreSQL DDL, Extensions (pgvector, pg_trgm), Automated Triggers, and High-Performance Indexes',
    content: `-- ============================================================================
-- 01_SCHEMA.SQL: CORE ARCHITECTURE, AUTOMATED TRIGGERS & PRODUCTION INDEXES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector"; -- for 1024-dim BGE-M3 embeddings

-- 1. Shared core: Hierarchy Units
CREATE TABLE units (
  id        SERIAL PRIMARY KEY,
  parent_id INT REFERENCES units(id) ON DELETE RESTRICT,
  name_ar   TEXT NOT NULL,
  name_en   TEXT,
  level     TEXT NOT NULL CHECK (level IN ('company', 'continent', 'region', 'country', 'city')),
  path      TEXT NOT NULL UNIQUE,    -- e.g. '/1/4/12/31/'
  latitude  NUMERIC(9,6),            -- typed once -> offline map, zero geocoding latency
  longitude NUMERIC(9,6)
);

-- Crucial: text_pattern_ops allows LIKE 'prefix%' to use standard B-Tree index scan!
CREATE INDEX idx_units_path_pattern ON units (path text_pattern_ops);
CREATE INDEX idx_units_parent_id ON units (parent_id);

-- 2. Users & Authorization
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  unit_id       INT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  role          TEXT NOT NULL CHECK (role IN ('ceo', 'admin', 'editor', 'viewer'))
);

CREATE INDEX idx_users_unit_id ON users (unit_id);

-- 3. KPIs: Raw Counts per Unit per Day
CREATE TABLE kpi_daily (
  unit_id     INT  NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  kpi_code    TEXT NOT NULL,          -- 'MANPOWER_FILL', 'VEHICLE_FILL', etc.
  day         DATE NOT NULL,
  numerator   NUMERIC NOT NULL CHECK (numerator >= 0),       -- e.g. positions filled
  denominator NUMERIC NOT NULL CHECK (denominator >= 0),     -- e.g. positions authorized
  PRIMARY KEY (unit_id, kpi_code, day)
);

-- Covering index: allows Index-Only Scans for subtree hierarchical rollups
CREATE INDEX idx_kpi_daily_code_day_covering 
ON kpi_daily (kpi_code, day, unit_id) 
INCLUDE (numerator, denominator);

-- 4. Committees
CREATE TABLE committees (
  id      SERIAL PRIMARY KEY,
  name    TEXT NOT NULL,
  unit_id INT REFERENCES units(id) ON DELETE SET NULL
);

CREATE INDEX idx_committees_unit_id ON committees (unit_id);

-- 5. Committee Members
CREATE TABLE committee_members (
  id              SERIAL PRIMARY KEY,
  committee_id    INT NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  ref_number      TEXT UNIQUE NOT NULL,
  title           TEXT,
  full_name       TEXT NOT NULL,
  name_normalized TEXT,                                      -- for Arabic fuzzy search
  phone           TEXT,                                      -- validated international format
  location_id     INT REFERENCES units(id) ON DELETE SET NULL,
  beneficiary_id  INT REFERENCES units(id) ON DELETE SET NULL
);

-- GIN Trigram index for ultra-fast typo-tolerant Arabic search
CREATE INDEX idx_committee_members_name_trgm ON committee_members USING gin (name_normalized gin_trgm_ops);
CREATE INDEX idx_committee_members_location ON committee_members (location_id);
CREATE INDEX idx_committee_members_beneficiary ON committee_members (beneficiary_id);

-- 6. Committee Progress (1 row per date -> trend analysis & forecasting)
CREATE TABLE committee_progress (
  member_id  INT NOT NULL REFERENCES committee_members(id) ON DELETE CASCADE,
  day        DATE NOT NULL,
  percentage NUMERIC(5,2) CHECK (percentage BETWEEN 0 AND 100),
  PRIMARY KEY (member_id, day)
);

CREATE INDEX idx_committee_progress_day ON committee_progress (day);

-- 7. Committee Notes & Vector Storage
CREATE TABLE committee_notes (
  id           SERIAL PRIMARY KEY,
  member_id    INT NOT NULL REFERENCES committee_members(id) ON DELETE CASCADE,
  day          DATE NOT NULL,
  body         TEXT NOT NULL,
  ai_summary   TEXT,
  ai_category  TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive','neutral','negative')),
  embedding    vector(1024) -- BGE-M3 1024-dim concept embeddings
);

-- HNSW Cosine vector index for sub-millisecond semantic search
CREATE INDEX idx_committee_notes_embedding_hnsw 
ON committee_notes 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- AUTOMATED TRIGGERS: HIERARCHY PATH MAINTENANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_units_maintain_path()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := '/' || NEW.id || '/';
  ELSE
    SELECT path INTO v_parent_path FROM units WHERE id = NEW.parent_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent unit with id % does not exist', NEW.parent_id;
    END IF;
    NEW.path := v_parent_path || NEW.id || '/';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_units_before_insert
BEFORE INSERT ON units
FOR EACH ROW EXECUTE FUNCTION fn_units_maintain_path();

-- Cascading update trigger if parent changes
CREATE OR REPLACE FUNCTION fn_units_cascade_path_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.path IS DISTINCT FROM NEW.path THEN
    UPDATE units
    SET path = NEW.path || substring(path FROM length(OLD.path) + 1)
    WHERE path LIKE OLD.path || '%';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_units_after_update
AFTER UPDATE OF path ON units
FOR EACH ROW EXECUTE FUNCTION fn_units_cascade_path_update();

-- ============================================================================
-- ARABIC TEXT NORMALIZATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_arabic(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  result := lower(trim(input_text));
  -- Strip Tashkeel (diacritics: Fatha, Damma, Kasra, Tanween, Shadda, Sukun)
  result := regexp_replace(result, '[\\u064B-\\u065F\\u0670]', '', 'g');
  -- Strip Tatweel (kashida)
  result := regexp_replace(result, '[\\u0640]', '', 'g');
  -- Standardize Alef variations (أ, إ, آ, ٱ -> ا)
  result := regexp_replace(result, '[أإآٱ]', 'ا', 'g');
  -- Standardize Taa Marbuta (ة -> ه)
  result := regexp_replace(result, 'ة', 'ه', 'g');
  -- Standardize Alef Maqsura (ى -> ي)
  result := regexp_replace(result, 'ى', 'ي', 'g');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fn_normalize_member_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_normalized := normalize_arabic(NEW.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_member_normalize_name
BEFORE INSERT OR UPDATE OF full_name ON committee_members
FOR EACH ROW EXECUTE FUNCTION fn_normalize_member_name();
`,
  },
  {
    id: '02_security_rls',
    name: '02_security_rls.sql',
    description: 'PostgreSQL Row-Level Security (RLS) for Hierarchy Scoping and Multi-Tenant Isolation',
    content: `-- ============================================================================
-- 02_SECURITY_RLS.SQL: DYNAMIC HIERARCHY SCOPING AT THE ENGINE LAYER
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_notes ENABLE ROW LEVEL SECURITY;

-- Helper to retrieve current authenticated user's unit path from session
CREATE OR REPLACE FUNCTION fn_current_user_unit_path()
RETURNS TEXT AS $$
DECLARE
  v_path TEXT;
  v_user_id TEXT;
BEGIN
  v_user_id := current_setting('app.current_user_id', true);
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RETURN NULL;
  END IF;

  SELECT u.path INTO v_path
  FROM users usr
  JOIN units u ON u.id = usr.unit_id
  WHERE usr.id = v_user_id::INT;

  RETURN v_path;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. Units Policy: Users only see units in their own subtree
CREATE POLICY rls_units_isolation ON units
FOR ALL
USING (
  path LIKE fn_current_user_unit_path() || '%'
);

-- 2. KPI Daily Policy: Automatically scoped through unit_id
CREATE POLICY rls_kpi_daily_isolation ON kpi_daily
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM units u 
    WHERE u.id = kpi_daily.unit_id 
    AND u.path LIKE fn_current_user_unit_path() || '%'
  )
);

-- 3. Committees Policy: Scoped by unit_id
CREATE POLICY rls_committees_isolation ON committees
FOR ALL
USING (
  unit_id IS NULL OR EXISTS (
    SELECT 1 FROM units u 
    WHERE u.id = committees.unit_id 
    AND u.path LIKE fn_current_user_unit_path() || '%'
  )
);

-- 4. Committee Members: Scoped by either Location or Beneficiary unit
CREATE POLICY rls_members_isolation ON committee_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM units u 
    WHERE (u.id = committee_members.location_id OR u.id = committee_members.beneficiary_id)
    AND u.path LIKE fn_current_user_unit_path() || '%'
  )
);

-- 5. Progress & Notes: Inherited from member visibility
CREATE POLICY rls_progress_isolation ON committee_progress
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM committee_members m
    WHERE m.id = committee_progress.member_id
  )
);

CREATE POLICY rls_notes_isolation ON committee_notes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM committee_members m
    WHERE m.id = committee_notes.member_id
  )
);
`,
  },
  {
    id: '03_seed_data',
    name: '03_seed_data.sql',
    description: 'Bilingual Seed Hierarchy (HQ, Continents, Countries, Cities), Users, KPIs & Notes',
    content: `-- ============================================================================
-- 03_SEED_DATA.SQL: REALISTIC MULTILINGUAL ENTERPRISE DATA
-- ============================================================================

INSERT INTO units (id, parent_id, name_ar, name_en, level, path, latitude, longitude) VALUES
(1, NULL, 'المركز الرئيسي العالمي', 'Global Headquarters', 'company', '/1/', 24.7136, 46.6753),
(2, 1, 'منطقة الشرق الأوسط', 'Middle East Region', 'continent', '/1/2/', 25.2048, 55.2708),
(3, 1, 'منطقة أوروبا', 'Europe Region', 'continent', '/1/3/', 50.1109, 8.6821),
(4, 1, 'منطقة الأمريكتين', 'Americas Region', 'continent', '/1/4/', 40.7128, -74.0060),
(10, 2, 'المملكة العربية السعودية', 'Saudi Arabia', 'country', '/1/2/10/', 24.7743, 46.7386),
(11, 2, 'دولة الإمارات العربية المتحدة', 'United Arab Emirates', 'country', '/1/2/11/', 24.4539, 54.3773),
(20, 3, 'جمهورية ألمانيا الاتحادية', 'Germany', 'country', '/1/3/20/', 52.5200, 13.4050),
(21, 3, 'المملكة المتحدة', 'United Kingdom', 'country', '/1/3/21/', 51.5074, -0.1278),
(22, 3, 'الجمهورية الفرنسية', 'France', 'country', '/1/3/22/', 48.8566, 2.3522),
(30, 10, 'محور عمليات الرياض', 'Riyadh Operational Hub', 'city', '/1/2/10/30/', 24.7136, 46.6753),
(31, 10, 'مركز لوجستيات جدة', 'Jeddah Logistics Center', 'city', '/1/2/10/31/', 21.4858, 39.1925),
(32, 10, 'مركز الدمام الإقليمي', 'Dammam Regional Center', 'city', '/1/2/10/32/', 26.4207, 50.0888),
(33, 11, 'فرع عمليات دبي', 'Dubai Operations Branch', 'city', '/1/2/11/33/', 25.2048, 55.2708),
(40, 20, 'قاعدة برلين التقنية', 'Berlin Tech Base', 'city', '/1/3/20/40/', 52.5200, 13.4050),
(41, 20, 'محور ميونخ الهندسي', 'Munich Engineering Hub', 'city', '/1/3/20/41/', 48.1351, 11.5820),
(42, 21, 'فرع لندن التشغيلي', 'London Financial & Ops Branch', 'city', '/1/3/21/42/', 51.5074, -0.1278),
(43, 22, 'مكتب باريس الميداني', 'Paris Field Office', 'city', '/1/3/22/43/', 48.8566, 2.3522);

SELECT setval('units_id_seq', (SELECT MAX(id) FROM units));

-- Insert Enterprise Roles
INSERT INTO users (id, username, password_hash, unit_id, role) VALUES
(1, 'tariq_ceo', '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$ceo_hash', 1, 'ceo'),
(2, 'elena_europe', '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$eu_hash', 3, 'admin'),
(3, 'fahad_mideast', '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$me_hash', 2, 'admin'),
(4, 'sarah_ksa', '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$ksa_hash', 10, 'editor'),
(5, 'lukas_berlin', '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$ber_hash', 40, 'viewer');
`,
  },
  {
    id: '04_analytics',
    name: '04_analytics_and_queries.sql',
    description: 'Subtree Rollups, Velocity Forecasting, Arabic Trigram Search, and Offline GeoJSON Export',
    content: `-- ============================================================================
-- 04_ANALYTICS_AND_QUERIES.SQL: HIGH-PERFORMANCE PRODUCTION QUERIES
-- ============================================================================

-- 1. Europe's manpower fulfilment today, rolled up the right way
-- Prevents the 'average of averages' statistical fallacy:
SELECT 
    ROUND(100.0 * SUM(numerator) / NULLIF(SUM(denominator), 0), 1) AS weighted_pct,
    SUM(numerator) AS total_filled,
    SUM(denominator) AS total_authorized
FROM kpi_daily k 
JOIN units u ON u.id = k.unit_id
WHERE u.path LIKE '/1/3/%' 
  AND k.kpi_code = 'MANPOWER_FILL' 
  AND k.day = CURRENT_DATE;

-- 2. Subtree Breakdown by Immediate Child Entities
WITH target_scope AS (
    SELECT path FROM units WHERE id = 3 -- Europe Region
)
SELECT 
    country.id AS unit_id,
    country.name_ar,
    country.name_en,
    SUM(k.numerator) AS total_positions_filled,
    SUM(k.denominator) AS total_positions_authorized,
    ROUND(100.0 * SUM(k.numerator) / NULLIF(SUM(denominator), 0), 2) AS fill_percentage
FROM units country
JOIN target_scope ts ON country.parent_id = 3
JOIN units city ON city.path LIKE country.path || '%'
JOIN kpi_daily k ON k.unit_id = city.id 
                AND k.kpi_code = 'MANPOWER_FILL' 
                AND k.day = CURRENT_DATE
GROUP BY country.id, country.name_ar, country.name_en;

-- 3. Committee Velocity & Forecast Days to Completion (Window Function)
SELECT 
    member_id,
    day,
    percentage,
    percentage - LAG(percentage, 1) OVER (PARTITION BY member_id ORDER BY day) AS daily_velocity,
    ROUND(AVG(percentage) OVER (PARTITION BY member_id ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS moving_avg_7d,
    CASE 
        WHEN percentage >= 100 THEN 0
        WHEN (percentage - LAG(percentage, 1) OVER (PARTITION BY member_id ORDER BY day)) > 0 
        THEN CEIL((100 - percentage) / (percentage - LAG(percentage, 1) OVER (PARTITION BY member_id ORDER BY day)))
        ELSE NULL 
    END AS estimated_days_to_completion
FROM committee_progress;

-- 4. Fast Arabic Fuzzy Search on Normalized Names
SELECT 
    cm.id,
    cm.ref_number,
    cm.title,
    cm.full_name,
    cm.phone,
    u_loc.name_ar AS location_name,
    u_ben.name_ar AS beneficiary_name,
    similarity(cm.name_normalized, normalize_arabic(:search_term)) AS match_score
FROM committee_members cm
LEFT JOIN units u_loc ON u_loc.id = cm.location_id
LEFT JOIN units u_ben ON u_ben.id = cm.beneficiary_id
WHERE cm.name_normalized % normalize_arabic(:search_term)
ORDER BY match_score DESC;

-- 5. Zero-Geocoding Offline GeoJSON Generator for Maps
SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(jsonb_agg(
        jsonb_build_object(
            'type', 'Feature',
            'geometry', jsonb_build_object(
                'type', 'Point',
                'coordinates', jsonb_build_array(u.longitude, u.latitude)
            ),
            'properties', jsonb_build_object(
                'unit_id', u.id,
                'name_ar', u.name_ar,
                'name_en', u.name_en,
                'level', u.level,
                'path', u.path
            )
        )
    ), '[]'::jsonb)
) AS geojson_map_data
FROM units u
WHERE u.latitude IS NOT NULL AND u.longitude IS NOT NULL;
`,
  },
];
