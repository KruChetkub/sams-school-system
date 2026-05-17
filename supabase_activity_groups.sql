-- Activity Groups (safe additive migration)
create table if not exists public.activity_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_group_members (
  id uuid primary key default gen_random_uuid(),
  activity_group_id uuid not null references public.activity_groups(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(activity_group_id, student_id)
);

create index if not exists idx_activity_group_members_group on public.activity_group_members(activity_group_id);
create index if not exists idx_activity_group_members_student on public.activity_group_members(student_id);
