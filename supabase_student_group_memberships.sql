-- Use existing classrooms/subjects as selectable groups
create table if not exists public.student_group_memberships (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  group_type text not null check (group_type in ('CLASSROOM', 'SUBJECT')),
  group_id uuid not null,
  created_at timestamptz not null default now(),
  unique(student_id, group_type, group_id)
);

create index if not exists idx_student_group_memberships_student on public.student_group_memberships(student_id);
create index if not exists idx_student_group_memberships_group on public.student_group_memberships(group_type, group_id);
