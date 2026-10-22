begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
-- Entire fixture is rolled back. These are synthetic IDs and reserved example.test addresses.
insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','director@example.test'),
 ('10000000-0000-4000-8000-000000000002','pm-a@example.test'),
 ('10000000-0000-4000-8000-000000000003','site-a@example.test'),
 ('10000000-0000-4000-8000-000000000004','site-b@example.test'),
 ('10000000-0000-4000-8000-000000000005','inactive@example.test');
insert into public.profiles(id,display_name,role,active) values
 ('10000000-0000-4000-8000-000000000001','Test director','director_admin',true),
 ('10000000-0000-4000-8000-000000000002','Test PM A','project_manager',true),
 ('10000000-0000-4000-8000-000000000003','Test Site A','site_manager',true),
 ('10000000-0000-4000-8000-000000000004','Test Site B','site_manager',true),
 ('10000000-0000-4000-8000-000000000005','Inactive test','site_manager',false);
insert into public.projects(id,code,name) values
 ('20000000-0000-4000-8000-000000000001','TEST-A','Synthetic project A'),
 ('20000000-0000-4000-8000-000000000002','TEST-B','Synthetic project B');
insert into public.project_memberships(project_id,user_id) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'),
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003'),
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004');
insert into public.daily_reports(id,project_id,author_id,report_date,status) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','2026-10-22','approved'),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','2026-10-22','draft');
insert into public.report_entries(report_id,kind,content) values
 ('30000000-0000-4000-8000-000000000001','activity','{}'),
 ('30000000-0000-4000-8000-000000000002','activity','{}');
insert into public.monthly_reports(project_id,period) values
 ('20000000-0000-4000-8000-000000000001','2026-10-01'),
 ('20000000-0000-4000-8000-000000000002','2026-10-01');
insert into storage.objects(bucket_id,name) values
 ('site-photos','20000000-0000-4000-8000-000000000001/test.jpg'),
 ('site-photos','20000000-0000-4000-8000-000000000002/test.jpg'),
 ('company-branding','company/test.png');
select is((select count(*)::int from pg_enum where enumtypid='public.employee_role'::regtype),3,'Exactly three roles');
select is((select count(*)::int from storage.buckets where id in ('site-photos','project-documents','company-branding','report-files') and public),0,'All buckets private');
set local role anon;
select throws_ok('select * from public.projects','42501','permission denied for table projects','Anonymous cannot read projects');
select throws_ok('select public.save_project(null,''x'',''x'','''')','42501','permission denied for function save_project','Anonymous cannot execute project administration');
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","user_metadata":{"role":"director_admin"}}',true);
set local role authenticated;
select is(public.current_employee_role()::text,'site_manager','Editable JWT metadata does not grant a role');
select is((select count(*)::int from public.projects),1,'SM sees only assigned project');
select is((select count(*)::int from public.profiles),1,'SM sees own profile only');
select is((select count(*)::int from public.daily_reports),1,'SM cannot read another project daily');
select is((select count(*)::int from public.report_entries),1,'Child rows are project scoped');
select is((select count(*)::int from public.monthly_reports),1,'Monthly rows are project scoped');
select is((select count(*)::int from public.projects where id='20000000-0000-4000-8000-000000000002'),0,'Known foreign project UUID does not bypass RLS');
select is((select count(*)::int from storage.objects where bucket_id='site-photos'),1,'Only assigned project photos visible');
select is(public.object_project_access('invalid/path'),false,'Malformed storage path denied safely');
select throws_ok('update public.profiles set role=''director_admin''','42501','permission denied for table profiles','Cannot self-promote');
select throws_ok('insert into public.projects(code,name) values(''HACK'',''HACK'')','42501','permission denied for table projects','Cannot bypass project RPC');
select throws_ok('select public.save_project(null,''HACK'',''HACK'','''')','42501','Director access required','SM cannot create projects by RPC');
select throws_ok('update public.daily_reports set content=''{}''','42501','permission denied for table daily_reports','Stage 1 does not expose report mutation or approved edits');
select throws_ok('insert into storage.objects(bucket_id,name) values(''site-photos'',''20000000-0000-4000-8000-000000000002/forbidden.jpg'')','42501',null,'Cannot upload into another project');
select throws_ok('insert into storage.objects(bucket_id,name) values(''report-files'',''20000000-0000-4000-8000-000000000001/fake.pdf'')','42501',null,'Cannot forge an official PDF');
select throws_ok('insert into storage.objects(bucket_id,name) values(''company-branding'',''company/fake.png'')','42501',null,'SM cannot modify company branding');
select lives_ok('insert into storage.objects(bucket_id,name) values(''site-photos'',''20000000-0000-4000-8000-000000000001/new.jpg'')','Assigned active project permits write-once upload');
with changed as (update storage.objects set name='tampered' where bucket_id='site-photos' returning id) select is(count(*)::int,0,'Authenticated files cannot be overwritten') from changed;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is(public.current_employee_role()::text,'project_manager','PM role comes from database');
select is((select count(*)::int from public.projects),1,'PM sees assigned projects only');
select throws_ok('select public.set_membership(''20000000-0000-4000-8000-000000000002'',''10000000-0000-4000-8000-000000000002'',true)','42501','Director access required','PM cannot assign themselves a project');
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000005","role":"authenticated"}',true);
set local role authenticated;
select is(public.current_employee_role()::text,null,'Inactive account has no application role');
select is((select count(*)::int from public.projects),0,'Inactive member loses project access');
select is((select count(*)::int from storage.objects),0,'Inactive member loses file access');
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::int from public.projects),2,'Director sees all projects');
select lives_ok('select public.archive_project(''20000000-0000-4000-8000-000000000001'',true)','Director can archive project');
select is((select count(*)::int from public.daily_reports),2,'Archiving preserves historical reports');
select is(public.can_upload_to_project('20000000-0000-4000-8000-000000000001'),false,'Archived project cannot receive uploads');
select throws_ok('select public.set_employee(''10000000-0000-4000-8000-000000000001'',''Test director'',''site_manager'',true)','23514','Cannot remove the last active director','Cannot demote last director');
select lives_ok('select public.set_membership(''20000000-0000-4000-8000-000000000002'',''10000000-0000-4000-8000-000000000003'',true)','Director can assign employee');
select lives_ok('select public.save_project(null,''TEST-C'',''Synthetic project C'',''Test only'')','Director can create project');
select ok((select count(*)>0 from public.audit_events),'Administration creates database audit events');
select throws_ok('delete from public.audit_events','42501','permission denied for table audit_events','Audit cannot be deleted via user API');
select * from finish();
rollback;
