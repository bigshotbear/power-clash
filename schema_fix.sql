-- Run this if you get "Could not find the X column in the schema cache"
-- Safe to run any number of times.

alter table public.fighters add column if not exists is_valid_build boolean default false;
alter table public.fighters add column if not exists base_image_key text;
alter table public.fighters add column if not exists overlay_keys text[] default '{}';
alter table public.fighters add column if not exists notes text;
alter table public.fighters add column if not exists stat_total int;
alter table public.fighters add column if not exists power_point_cap int;
alter table public.fighters add column if not exists power_point_cost int;

-- Forces PostgREST (Supabase's API layer) to reload its cached schema
-- immediately instead of waiting for its next automatic refresh.
notify pgrst, 'reload schema';
