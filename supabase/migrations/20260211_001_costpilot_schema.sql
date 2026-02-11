-- Core entities
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  seating_capacity integer,
  region text,
  city text,
  cuisine text,
  target_food_cost_percentage numeric,
  target_food_cost_range jsonb,
  category_targets jsonb,
  default_currency text,
  timezone text,
  pos_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  category text,
  unit text,
  last_purchase_price numeric,
  benchmark_price numeric,
  last_purchased_date timestamptz,
  price_trend jsonb,
  current_stock numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pos_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  category text,
  selling_price numeric,
  has_recipe boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  pos_item_id uuid references pos_items(id) on delete cascade,
  pos_item_name text,
  selling_price numeric,
  ingredients jsonb,
  total_plate_cost numeric,
  food_cost_percentage numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  date timestamptz not null,
  ingredient_id uuid,
  ingredient_name text,
  quantity numeric,
  unit text,
  total_price numeric,
  unit_price numeric,
  supplier_id text,
  supplier text,
  type text,
  created_at timestamptz not null default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  title text,
  description text,
  type text,
  severity text,
  date timestamptz,
  status text,
  related_id text,
  created_at timestamptz not null default now()
);

create table if not exists sales_records (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  pos_item_id uuid,
  pos_item_name text,
  date timestamptz,
  quantity numeric,
  created_at timestamptz not null default now()
);

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  file_name text,
  file_url text,
  uploaded_at timestamptz,
  receipt_date timestamptz,
  week_start timestamptz,
  items jsonb,
  created_at timestamptz not null default now()
);

create table if not exists dashboard_kpis (
  restaurant_id uuid references restaurants(id) on delete cascade,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists analytics_data (
  restaurant_id uuid references restaurants(id) on delete cascade,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists dishes_over_target (
  restaurant_id uuid references restaurants(id) on delete cascade,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Import profile + jobs
create table if not exists import_profiles (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  csv_type text not null,
  vendor_hint text,
  column_mappings jsonb not null default '{}'::jsonb,
  transforms jsonb not null default '{}'::jsonb,
  defaults jsonb not null default '{}'::jsonb,
  validation_rules jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  csv_type text not null,
  status text not null,
  file_name text not null,
  file_url text,
  detected_columns jsonb not null default '[]'::jsonb,
  column_mappings jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  error_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
