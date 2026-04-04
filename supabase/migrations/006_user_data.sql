-- ============================================================
-- DMSuite — User Data (KV Store)
-- Generic key-value persistence for user-level data that
-- must survive browser cache clears: preferences, settings,
-- tool-specific data (sketch library), analytics, etc.
-- ============================================================

create table if not exists public.user_data (
  user_id uuid references public.profiles(id) on delete cascade not null,
  data_key text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);

-- Enable RLS
alter table public.user_data enable row level security;

-- Users can read their own data
create policy "Users can view own data"
  on public.user_data for select
  using (auth.uid() = user_id);

-- Users can insert their own data
create policy "Users can create own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

-- Users can update their own data
create policy "Users can update own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own data
create policy "Users can delete own data"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- Service role full access
create policy "Service role full access on user_data"
  on public.user_data for all
  using (auth.role() = 'service_role');

-- ── Indexes ─────────────────────────────────────────────────

create index if not exists idx_user_data_user_id
  on public.user_data (user_id);

-- ── Updated-at trigger ──────────────────────────────────────

create trigger user_data_updated_at
  before update on public.user_data
  for each row execute function public.set_updated_at();
