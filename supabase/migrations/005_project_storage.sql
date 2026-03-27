-- ============================================================
-- DMSuite — Project Storage
-- Server-backed project metadata + workspace data snapshots
-- ============================================================

-- ── 1. User Projects (metadata) ─────────────────────────────

create table if not exists public.user_projects (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tool_id text not null,
  name text not null default 'Untitled Project',
  progress integer not null default 10,
  milestones text[] not null default '{"opened"}',
  has_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.user_projects enable row level security;

-- Users can read their own projects
create policy "Users can view own projects"
  on public.user_projects for select
  using (auth.uid() = user_id);

-- Users can insert their own projects
create policy "Users can create own projects"
  on public.user_projects for insert
  with check (auth.uid() = user_id);

-- Users can update their own projects
create policy "Users can update own projects"
  on public.user_projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own projects
create policy "Users can delete own projects"
  on public.user_projects for delete
  using (auth.uid() = user_id);

-- Service role full access
create policy "Service role full access on user_projects"
  on public.user_projects for all
  using (auth.role() = 'service_role');

-- ── 2. Project Data (workspace snapshots) ───────────────────

create table if not exists public.project_data (
  project_id text references public.user_projects(id) on delete cascade primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tool_id text not null,
  data jsonb not null default '{}',
  saved_at timestamptz not null default now(),
  size_bytes integer not null default 0
);

-- Enable RLS
alter table public.project_data enable row level security;

-- Users can read their own project data
create policy "Users can view own project data"
  on public.project_data for select
  using (auth.uid() = user_id);

-- Users can insert their own project data
create policy "Users can create own project data"
  on public.project_data for insert
  with check (auth.uid() = user_id);

-- Users can update their own project data
create policy "Users can update own project data"
  on public.project_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own project data
create policy "Users can delete own project data"
  on public.project_data for delete
  using (auth.uid() = user_id);

-- Service role full access
create policy "Service role full access on project_data"
  on public.project_data for all
  using (auth.role() = 'service_role');

-- ── 3. Indexes ──────────────────────────────────────────────

create index if not exists idx_user_projects_user_id
  on public.user_projects (user_id);

create index if not exists idx_user_projects_tool_id
  on public.user_projects (user_id, tool_id);

create index if not exists idx_user_projects_updated
  on public.user_projects (user_id, updated_at desc);

create index if not exists idx_project_data_user_id
  on public.project_data (user_id);

-- ── 4. Updated-at trigger ───────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_projects_updated_at
  before update on public.user_projects
  for each row execute function public.set_updated_at();
