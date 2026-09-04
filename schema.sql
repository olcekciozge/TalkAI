-- ============================================================
-- TalkAI Supabase schema
-- Supabase Dashboard -> SQL Editor -> New query -> paste & run
-- ============================================================

-- 1) PROFILES
-- auth.users ile 1:1. Kullanici kayit olunca asagidaki trigger ile
-- otomatik olusturuluyor, elle insert etmene gerek yok.
create table public.profiles (
                                 id uuid primary key references auth.users(id) on delete cascade,
                                 email text,
                                 display_name text,
                                 target_level text check (target_level in ('A1', 'A2', 'B1', 'B2')),
                                 favorite_scenario_ids text[] not null default '{}',
                                 created_at timestamptz not null default now()
);

-- 2) SESSIONS
-- lib/sessionStorage.ts'teki StoredSession ile birebir ayni sekil.
create table public.sessions (
                                 id uuid primary key default gen_random_uuid(),
                                 user_id uuid not null references auth.users(id) on delete cascade,
                                 scenario_id text not null,
                                 scenario_title text not null,
                                 overall_score integer not null,
                                 feedback jsonb not null,
                                 transcript jsonb not null default '[]',
                                 created_at timestamptz not null default now()
);

create index sessions_user_id_created_at_idx
    on public.sessions (user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- Bir kullanici SADECE kendi satirlarini gorebilir/yazabilir.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

create policy "Users can view own profile"
    on public.profiles for select
                                      using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
                                      using (auth.uid() = id);

create policy "Users can view own sessions"
    on public.sessions for select
                                      using (auth.uid() = user_id);

create policy "Users can insert own sessions"
    on public.sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
    on public.sessions for delete
using (auth.uid() = user_id);

-- ============================================================
-- Yeni kullanici kayit olunca profiles tablosuna otomatik satir ekle
-- ============================================================

create function public.handle_new_user()
    returns trigger
    language plpgsql
security definer set search_path = public
as $$
begin
insert into public.profiles (id, email)
values (new.id, new.email);
return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();