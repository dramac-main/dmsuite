-- ============================================================
-- DMSuite — Admin Role
-- Adds is_admin flag to profiles for admin panel access
-- ============================================================

-- Add admin flag (default false for all existing users)
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Grant admin to the primary account (drakemacchiko@gmail.com)
-- Run this after the column is added:
-- UPDATE public.profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'drakemacchiko@gmail.com');
