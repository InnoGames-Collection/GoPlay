-- GoPlay EthioRunner — unified server-authoritative schema.
-- Apply once in Supabase SQL Editor. Re-running is safe (idempotent).

-- ---------------------------------------------------------------- profiles ---
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default 'Player',
  phone      text,
  coins      bigint not null default 0,
  role       text not null default 'player',
  skins      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'Player'),
    case
      when new.phone is null or new.phone = '' then null
      when left(new.phone, 1) = '+' then new.phone
      else '+' || new.phone
    end
  )
  on conflict (id) do update set phone = coalesce(public.profiles.phone, excluded.phone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ----------------------------------------------------------- apply_coins -----
create or replace function public.apply_coins(
  p_user uuid, p_delta bigint, p_reason text, p_ref text default ''
) returns bigint language plpgsql security definer set search_path = public as $$
declare new_bal bigint;
begin
  update public.profiles
     set coins = coins + p_delta
   where id = p_user and coins + p_delta >= 0
   returning coins into new_bal;
  if new_bal is null then
    raise exception 'insufficient_or_missing' using errcode = 'check_violation';
  end if;
  insert into public.wallet_ledger (user_id, delta, reason, ref, balance_after)
    values (p_user, p_delta, p_reason, p_ref, new_bal);
  return new_bal;
end;
$$;

-- --------------------------------------------------------- wallet / config ---
create table if not exists public.wallet_ledger (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  delta         bigint not null,
  reason        text not null,
  ref           text not null default '',
  balance_after bigint not null,
  created_at    timestamptz not null default now()
);
create index if not exists wallet_ledger_user_idx on public.wallet_ledger (user_id, created_at desc);
alter table public.wallet_ledger enable row level security;
drop policy if exists "ledger own read" on public.wallet_ledger;
create policy "ledger own read" on public.wallet_ledger
  for select using (auth.uid() = user_id or public.is_admin());

create table if not exists public.app_config (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
drop policy if exists "config readable" on public.app_config;
create policy "config readable" on public.app_config for select using (true);
drop policy if exists "config admin write" on public.app_config;
create policy "config admin write" on public.app_config
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.payment_orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  package_id  text not null,
  coins       bigint not null,
  amount_etb  numeric not null,
  method      text not null,
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);
alter table public.payment_orders enable row level security;
drop policy if exists "orders own read" on public.payment_orders;
create policy "orders own read" on public.payment_orders
  for select using (auth.uid() = user_id or public.is_admin());

create table if not exists public.used_nonces (
  jti     text primary key,
  user_id uuid,
  used_at timestamptz not null default now()
);
alter table public.used_nonces enable row level security;

-- ============================================================ RUNNER ECONOMY
-- EthioRunner tournament stack — the ONLY scoring path for this game.

create table if not exists public.runner_xp (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  xp         bigint not null default 0,
  xp_season  bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.runner_xp enable row level security;
drop policy if exists "runner_xp readable" on public.runner_xp;
create policy "runner_xp readable" on public.runner_xp for select using (true);

-- Daily practice XP cap (3 rewarded sessions/day per mechanics §3.1).
create table if not exists public.runner_practice_daily (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  sessions integer not null default 0,
  primary key (user_id, day)
);
alter table public.runner_practice_daily enable row level security;
drop policy if exists "practice own read" on public.runner_practice_daily;
create policy "practice own read" on public.runner_practice_daily
  for select using (auth.uid() = user_id);

-- Rolling p95 for RP normalization (mechanics §4.2).
create table if not exists public.runner_p95 (
  game_id    text primary key default 'ethiorunner',
  p95_score  bigint not null default 1500,
  sample_count integer not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.runner_p95 (game_id, p95_score) values ('ethiorunner', 1500)
  on conflict (game_id) do nothing;
alter table public.runner_p95 enable row level security;
drop policy if exists "p95 readable" on public.runner_p95;
create policy "p95 readable" on public.runner_p95 for select using (true);

-- Raw score samples for p95 recalculation.
create table if not exists public.runner_score_samples (
  id         bigint generated always as identity primary key,
  raw_score  bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists runner_samples_time_idx on public.runner_score_samples (created_at desc);
alter table public.runner_score_samples enable row level security;

-- Tournament windows: daily / weekly / monthly (mechanics §4.1).
create table if not exists public.runner_tournaments (
  id               text primary key,
  period           text not null check (period in ('daily','weekly','monthly')),
  title_en         text not null,
  title_am         text not null,
  entry_fee_coins  bigint not null,
  attempts         integer not null,
  min_level        integer not null default 1,
  prize_pool_coins bigint not null default 0,
  payout_pct       integer not null default 65,
  prize_tiers      jsonb not null default '[{"rank":1,"pct":50},{"rank":2,"pct":30},{"rank":3,"pct":20}]'::jsonb,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  state            text not null default 'live' check (state in ('live','ended','settling','settled')),
  created_at       timestamptz not null default now()
);
alter table public.runner_tournaments enable row level security;
drop policy if exists "runner_tournaments readable" on public.runner_tournaments;
create policy "runner_tournaments readable" on public.runner_tournaments for select using (true);
drop policy if exists "runner_tournaments admin write" on public.runner_tournaments;
create policy "runner_tournaments admin write" on public.runner_tournaments
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.runner_entries (
  user_id            uuid not null references auth.users (id) on delete cascade,
  tournament_id      text not null references public.runner_tournaments (id) on delete cascade,
  attempts_purchased integer not null default 0,
  attempts_used      integer not null default 0,
  fee_paid           bigint not null default 0,
  entered_at         timestamptz not null default now(),
  primary key (user_id, tournament_id)
);
alter table public.runner_entries enable row level security;
drop policy if exists "runner_entries own read" on public.runner_entries;
create policy "runner_entries own read" on public.runner_entries
  for select using (auth.uid() = user_id or public.is_admin());

-- Best RP per tournament; tie-break by earliest best_at (mechanics §4.2).
create table if not exists public.runner_scores (
  user_id       uuid not null references auth.users (id) on delete cascade,
  tournament_id text not null references public.runner_tournaments (id) on delete cascade,
  best_raw      bigint not null default 0,
  best_rp       numeric(6,2) not null default 0,
  best_at       timestamptz,
  plays         integer not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, tournament_id)
);
create index if not exists runner_scores_board_idx
  on public.runner_scores (tournament_id, best_rp desc, best_at asc);
alter table public.runner_scores enable row level security;
drop policy if exists "runner_scores readable" on public.runner_scores;
create policy "runner_scores readable" on public.runner_scores for select using (true);

-- -------------------------------------------------------------- RPCs / views
create or replace function public.runner_apply_xp(p_user uuid, p_delta bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare new_xp bigint;
begin
  insert into public.runner_xp (user_id, xp, xp_season, updated_at)
    values (p_user, greatest(p_delta, 0), greatest(p_delta, 0), now())
  on conflict (user_id) do update set
    xp         = public.runner_xp.xp        + greatest(p_delta, 0),
    xp_season  = public.runner_xp.xp_season + greatest(p_delta, 0),
    updated_at = now()
  returning xp into new_xp;
  return new_xp;
end;
$$;

create or replace function public.runner_level_for(p_xp bigint)
returns integer language sql immutable as $$
  select 1 + floor(sqrt(greatest(0, p_xp)::numeric / 100))::integer;
$$;

create or replace function public.recalc_runner_p95()
returns bigint language plpgsql security definer set search_path = public as $$
declare p95 bigint; n int;
begin
  select count(*) into n from (
    select raw_score from public.runner_score_samples
    order by created_at desc limit 500
  ) s;
  if n < 10 then return (select p95_score from public.runner_p95 where game_id = 'ethiorunner'); end if;
  select percentile_cont(0.95) within group (order by raw_score)::bigint into p95
    from (select raw_score from public.runner_score_samples order by created_at desc limit 500) s;
  p95 := greatest(100, coalesce(p95, 1500));
  update public.runner_p95 set p95_score = p95, sample_count = n, updated_at = now()
    where game_id = 'ethiorunner';
  return p95;
end;
$$;

create or replace view public.runner_leaderboard
with (security_invoker = on) as
select
  s.tournament_id,
  s.user_id,
  coalesce(p.name, 'Player') as name,
  s.best_rp                  as score,
  s.best_raw                 as raw_score,
  rank() over (
    partition by s.tournament_id
    order by s.best_rp desc, s.best_at asc nulls last
  ) as rank
from public.runner_scores s
left join public.profiles p on p.id = s.user_id
where s.best_rp > 0;
grant select on public.runner_leaderboard to anon, authenticated;

-- Season: average of best RP across tournaments entered (min 3 to qualify, mechanics §5.1).
create or replace view public.runner_season_leaderboard
with (security_invoker = on) as
with bests as (
  select user_id, tournament_id, best_rp
  from public.runner_scores where best_rp > 0
),
agg as (
  select user_id,
         count(*) as tourneys,
         avg(best_rp) as avg_rp
  from bests group by user_id
  having count(*) >= 3
)
select
  a.user_id,
  coalesce(p.name, 'Player') as name,
  round(a.avg_rp, 2) as season_score,
  a.tourneys,
  rank() over (order by a.avg_rp desc) as rank
from agg a
left join public.profiles p on p.id = a.user_id;
grant select on public.runner_season_leaderboard to anon, authenticated;

-- Ensure active tournament windows exist (daily / weekly / monthly).
create or replace function public.ensure_runner_tournaments()
returns void language plpgsql security definer set search_path = public as $$
declare
  d_start timestamptz := date_trunc('day', now());
  d_end   timestamptz := d_start + interval '1 day';
  w_start timestamptz := date_trunc('week', now());
  w_end   timestamptz := w_start + interval '7 days';
  m_start timestamptz := date_trunc('month', now());
  m_end   timestamptz := m_start + interval '1 month';
begin
  insert into public.runner_tournaments
    (id, period, title_en, title_am, entry_fee_coins, attempts, min_level, starts_at, ends_at, state)
  values
    ('runner-daily-'  || to_char(now(), 'YYYY-MM-DD'), 'daily',   'Daily Sprint',    'ዕለታዊ ሩጫ',   10,  3,  3, d_start, d_end, 'live'),
    ('runner-weekly-' || to_char(now(), 'IYYY-IW'),   'weekly',  'Weekly Cup',      'ሳምንታዊ ዋንጫ', 30,  5,  5, w_start, w_end, 'live'),
    ('runner-monthly-'|| to_char(now(), 'YYYY-MM'),    'monthly', 'Monthly Championship', 'ወርሃዊ ሻምፒዮና', 75, 10, 10, m_start, m_end, 'live')
  on conflict (id) do update set
    starts_at = excluded.starts_at,
    ends_at   = excluded.ends_at,
    state     = case when public.runner_tournaments.state = 'settled' then 'settled' else 'live' end;
end;
$$;

create or replace function public.active_runner_tournament(p_period text default null)
returns text language sql stable security definer set search_path = public as $$
  select id from public.runner_tournaments
   where state = 'live' and now() >= starts_at and now() < ends_at
     and (p_period is null or period = p_period)
   order by case period when 'daily' then 1 when 'weekly' then 2 else 3 end
   limit 1;
$$;

create or replace function public.settle_due_runner_tournaments()
returns int language plpgsql security definer set search_path = public as $$
declare
  tour record; tier record; winner record; n int := 0; coins bigint;
begin
  for tour in
    select * from public.runner_tournaments
    where state in ('live','ended','settling') and ends_at <= now()
  loop
    update public.runner_tournaments set state = 'settling' where id = tour.id and state <> 'settled';
    for tier in select * from jsonb_to_recordset(tour.prize_tiers) as t(rank int, pct int) loop
      select s.user_id into winner
        from public.runner_scores s
       where s.tournament_id = tour.id
       order by s.best_rp desc, s.best_at asc nulls last
       offset (tier.rank - 1) limit 1;
      if winner.user_id is null then continue; end if;
      coins := round(tour.prize_pool_coins * tier.pct / 100.0);
      if coins > 0 then
        perform public.apply_coins(winner.user_id, coins, 'runner_prize', tour.id);
      end if;
    end loop;
    update public.runner_tournaments set state = 'settled' where id = tour.id;
    n := n + 1;
  end loop;
  if n > 0 then
    update public.runner_xp set xp_season = 0 where xp_season <> 0;
    perform public.ensure_runner_tournaments();
  end if;
  return n;
end;
$$;

revoke all on function public.runner_apply_xp(uuid, bigint) from public;
revoke all on function public.recalc_runner_p95() from public;
revoke all on function public.settle_due_runner_tournaments() from public;

-- Safe for clients: idempotent window creation (read path bootstrap).
grant execute on function public.ensure_runner_tournaments() to authenticated, anon;

-- Seed first windows.
select public.ensure_runner_tournaments();
