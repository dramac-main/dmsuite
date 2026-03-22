-- ============================================================
-- DMSuite — Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. Profiles table (extends auth.users) ──────────────────

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null default '',
  phone text default '',
  avatar_url text,
  credits integer not null default 50,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'agency')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (but not credits — that's server-only)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role can do everything (for webhooks and server operations)
create policy "Service role full access on profiles"
  on public.profiles for all
  using (auth.role() = 'service_role');

-- ── 2. Credit Transactions table ────────────────────────────

create table if not exists public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  balance_after integer not null,
  type text not null check (type in ('purchase', 'usage', 'bonus', 'refund')),
  description text not null default '',
  tool_id text,
  payment_ref text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.credit_transactions enable row level security;

-- Users can only read their own transactions
create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- Only server can insert transactions (prevents client-side manipulation)
create policy "Service role can insert transactions"
  on public.credit_transactions for insert
  with check (auth.role() = 'service_role');

-- ── 3. Payments table ───────────────────────────────────────

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  flw_ref text,
  flw_tx_id text,
  amount numeric not null,
  currency text not null default 'ZMW',
  credits_purchased integer not null,
  payment_method text not null check (payment_method in ('airtel_money', 'mtn_momo', 'card')),
  phone_number text,
  status text not null default 'pending' check (status in ('pending', 'successful', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.payments enable row level security;

-- Users can read their own payments
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Only server can insert/update payments
create policy "Service role can manage payments"
  on public.payments for all
  using (auth.role() = 'service_role');

-- ── 4. Auto-create profile on user signup ───────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

-- Trigger: run after each new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 5. Indexes for performance ──────────────────────────────

create index if not exists idx_credit_transactions_user_id
  on public.credit_transactions(user_id);

create index if not exists idx_credit_transactions_created_at
  on public.credit_transactions(created_at desc);

create index if not exists idx_payments_user_id
  on public.payments(user_id);

create index if not exists idx_payments_flw_ref
  on public.payments(flw_ref);

create index if not exists idx_payments_status
  on public.payments(status);

-- ── 6. Updated_at auto-update trigger ───────────────────────

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();
