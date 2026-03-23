-- Enable Supabase Realtime on the profiles table
-- This allows clients to subscribe to credit balance changes in real time
alter publication supabase_realtime add table profiles;

-- Set replica identity to full so UPDATE events include the full row
alter table profiles replica identity full;
