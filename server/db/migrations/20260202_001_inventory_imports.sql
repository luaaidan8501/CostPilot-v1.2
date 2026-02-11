-- Inventory import profiles
CREATE TABLE IF NOT EXISTS import_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  csv_type TEXT NOT NULL CHECK (csv_type IN ('items', 'movements', 'purchases')),
  vendor_hint TEXT,
  column_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  transforms JSONB NOT NULL DEFAULT '{}'::jsonb,
  defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS import_profiles_restaurant_idx ON import_profiles (restaurant_id);

-- Import jobs track each CSV upload + processing state
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  csv_type TEXT NOT NULL CHECK (csv_type IN ('items', 'movements', 'purchases')),
  status TEXT NOT NULL CHECK (status IN ('uploaded', 'mapped', 'validated', 'imported', 'failed')),
  file_name TEXT NOT NULL,
  file_url TEXT,
  detected_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS import_jobs_restaurant_idx ON import_jobs (restaurant_id);

-- Map incoming identifiers to stable item IDs
CREATE TABLE IF NOT EXISTS item_identity_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  source_key TEXT NOT NULL,
  canonical_item_id UUID NOT NULL,
  source_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, source_key)
);
