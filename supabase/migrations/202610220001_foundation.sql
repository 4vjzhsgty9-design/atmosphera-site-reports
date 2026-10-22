-- Stage 1 only: identity, project administration, protected report/storage foundation.
-- No production seed. Report mutations are deliberately disabled until Stage 2.
create type public.employee_role as enum ('director_admin', 'project_manager', 'site_manager');
create type public.report_status as enum ('draft', 'submitted', 'revision_required', 'approved');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (char_length(display_name) between 1 and 120),
  role public.employee_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 1 and 40),
  name text not null check (char_length(name) between 1 and 160),
  location text not null default '' check (char_length(location) <= 200),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.project_memberships (
  project_id uuid not null references public.projects(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  primary key (project_id, user_id)
);
create index memberships_user_idx on public.project_memberships(user_id);
create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  report_date date not null,
  series_id uuid not null default gen_random_uuid(),
  revision integer not null default 1 check (revision > 0),
  previous_id uuid unique references public.daily_reports(id) on delete restrict,
  status public.report_status not null default 'draft',
  content jsonb not null default '{}' check (jsonb_typeof(content) = 'object'),
  approved_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(series_id, revision)
);
create index daily_project_date_idx on public.daily_reports(project_id, report_date);
create table public.report_entries (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports(id) on delete restrict,
  kind text not null check (kind in ('manpower', 'activity', 'quantity', 'photo', 'material', 'equipment', 'safety', 'issue')),
  content jsonb not null check (jsonb_typeof(content) = 'object')
);
create index report_entries_report_idx on public.report_entries(report_id);
create table public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  period date not null check (extract(day from period) = 1),
  version integer not null default 1 check (version > 0),
  status public.report_status not null default 'draft',
  planned numeric(5,2) check (planned between 0 and 100),
  actual numeric(5,2) check (actual between 0 and 100),
  confirmed_by uuid references public.profiles(id) on delete restrict,
  confirmed_at timestamptz,
  source_snapshot jsonb not null default '{}' check (jsonb_typeof(source_snapshot) = 'object'),
  approved_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(project_id, period, version)
);
create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete restrict,
  action text not null,
  entity_id uuid,
  created_at timestamptz not null default now(),
  detail jsonb not null default '{}'
);

-- These helpers read trusted database profiles, never user_metadata / editable JWT roles.
-- Explicit empty search_path prevents object shadowing in SECURITY DEFINER functions.
create function public.current_employee_role() returns public.employee_role
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.active;
$$;
create function public.is_director() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_employee_role() = 'director_admin', false);
$$;
create function public.can_access_project(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_director() or (public.current_employee_role() is not null and exists (
    select 1 from public.project_memberships m where m.project_id = target and m.user_id = auth.uid()
  ));
$$;
create function public.can_upload_to_project(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.can_access_project(target) and exists (
    select 1 from public.projects p where p.id = target and p.archived_at is null
  );
$$;
create function public.object_project_access(object_name text, for_upload boolean default false) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare target uuid;
begin
  target := split_part(object_name, '/', 1)::uuid;
  if object_name not like '%/%' then return false; end if;
  if for_upload then return public.can_upload_to_project(target); end if;
  return public.can_access_project(target);
exception when invalid_text_representation then return false;
end;
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_memberships enable row level security;
alter table public.daily_reports enable row level security;
alter table public.report_entries enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.audit_events enable row level security;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_director());
create policy projects_read on public.projects for select to authenticated
  using (public.can_access_project(id));
create policy memberships_read on public.project_memberships for select to authenticated
  using (user_id = auth.uid() or public.is_director());
create policy daily_read on public.daily_reports for select to authenticated
  using (public.can_access_project(project_id));
create policy entries_read on public.report_entries for select to authenticated
  using (exists (select 1 from public.daily_reports r where r.id = report_id and public.can_access_project(r.project_id)));
create policy monthly_read on public.monthly_reports for select to authenticated
  using (public.can_access_project(project_id));
create policy audit_read on public.audit_events for select to authenticated using (public.is_director());
-- No direct writes. Even directors must use the explicitly authorised RPCs below.
revoke all on public.profiles, public.projects, public.project_memberships, public.daily_reports,
  public.report_entries, public.monthly_reports, public.audit_events from anon, authenticated;
grant select on public.profiles, public.projects, public.project_memberships, public.daily_reports,
  public.report_entries, public.monthly_reports, public.audit_events to authenticated;
grant all on public.profiles, public.projects, public.project_memberships, public.daily_reports,
  public.report_entries, public.monthly_reports, public.audit_events to service_role;
grant usage, select on sequence public.audit_events_id_seq to service_role;

create function public.require_director() returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_director() then raise exception 'Director access required' using errcode = '42501'; end if;
end;
$$;
create function public.save_project(target uuid, project_code text, project_name text, project_location text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 perform public.require_director();
 if target is null then
  insert into public.projects(code,name,location) values (trim(project_code),trim(project_name),trim(project_location)) returning id into result;
 else
  update public.projects set code=trim(project_code),name=trim(project_name),location=trim(project_location) where id=target returning id into result;
  if result is null then raise exception 'Project not found'; end if;
 end if;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'project.saved',result);
 return result;
end;
$$;
create function public.archive_project(target uuid, archived boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform public.require_director();
 update public.projects set archived_at=case when archived then now() else null end where id=target;
 if not found then raise exception 'Project not found'; end if;
 insert into public.audit_events(actor_id,action,entity_id,detail) values(auth.uid(),'project.archive_changed',target,jsonb_build_object('archived',archived));
end;
$$;
create function public.set_membership(target_project uuid, target_user uuid, assigned boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform public.require_director();
 if assigned then
  if not exists(select 1 from public.profiles where id=target_user and active) then raise exception 'Active employee required'; end if;
  insert into public.project_memberships(project_id,user_id) values(target_project,target_user) on conflict do nothing;
 else delete from public.project_memberships where project_id=target_project and user_id=target_user;
 end if;
 insert into public.audit_events(actor_id,action,entity_id,detail) values(auth.uid(),'membership.changed',target_project,jsonb_build_object('user_id',target_user,'assigned',assigned));
end;
$$;
-- Serialise admin role/deactivation changes so two concurrent requests cannot remove the last director.
create function public.set_employee(target uuid, employee_name text, employee_role public.employee_role, employee_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(63724310);
 perform public.require_director();
 if exists(select 1 from public.profiles where id=target and role='director_admin' and active)
   and (employee_role <> 'director_admin' or not employee_active)
   and (select count(*) from public.profiles where role='director_admin' and active) <= 1
 then raise exception 'Cannot remove the last active director' using errcode='23514'; end if;
 insert into public.profiles(id,display_name,role,active) values(target,trim(employee_name),employee_role,employee_active)
 on conflict(id) do update set display_name=excluded.display_name,role=excluded.role,active=excluded.active;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'employee.saved',target);
end;
$$;
-- PostgreSQL grants EXECUTE to PUBLIC by default: explicitly remove it for every function.
revoke execute on function public.current_employee_role(),public.is_director(),public.can_access_project(uuid),
 public.can_upload_to_project(uuid),public.object_project_access(text,boolean),public.require_director(),
 public.save_project(uuid,text,text,text),public.archive_project(uuid,boolean),
 public.set_membership(uuid,uuid,boolean),public.set_employee(uuid,text,public.employee_role,boolean) from public,anon;
grant execute on function public.current_employee_role(),public.is_director(),public.can_access_project(uuid),
 public.can_upload_to_project(uuid),public.object_project_access(text,boolean),public.require_director(),
 public.save_project(uuid,text,text,text),public.archive_project(uuid,boolean),
 public.set_membership(uuid,uuid,boolean),public.set_employee(uuid,text,public.employee_role,boolean) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('site-photos','site-photos',false,15728640,array['image/jpeg','image/png','image/webp']),
 ('project-documents','project-documents',false,20971520,array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
 ('company-branding','company-branding',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('report-files','report-files',false,52428800,array['application/pdf']);
create policy project_files_read on storage.objects for select to authenticated
 using(bucket_id in ('site-photos','project-documents','report-files') and public.object_project_access(name));
create policy project_files_insert on storage.objects for insert to authenticated
 with check(bucket_id in ('site-photos','project-documents') and public.object_project_access(name,true));
create policy branding_read on storage.objects for select to authenticated
 using(bucket_id='company-branding' and public.current_employee_role() is not null and
 (split_part(name,'/',1)='company' or public.object_project_access(name)));
create policy branding_insert on storage.objects for insert to authenticated
 with check(bucket_id='company-branding' and public.is_director());
-- No public buckets, no authenticated UPDATE/DELETE or report-files INSERT policies.
-- Write-once files cannot be overwritten through the user API. Stage 2 adds validated
-- upload finalisation and references; Stage 5 adds the report renderer.
