alter table public.artifacts drop constraint if exists artifacts_artifact_type_check;
alter table public.artifacts add constraint artifacts_artifact_type_check check (
  artifact_type = any (array[
    'brief','research','script','production_package','big_creative_idea','concept_development',
    'visual_development','storyboard','shot_design','asset_creation','scene_intelligence',
    'ai_generation_package','generated_video'
  ])
);

create or replace function public.start_video_generation_run(target_production_id uuid)
returns public.runs
language plpgsql security invoker set search_path = public as $$
declare
  approved_package_version_id uuid;
  target_task_id uuid;
  created_job public.jobs;
  created_run public.runs;
  next_attempt integer;
begin
  select av.id into approved_package_version_id
  from public.artifacts a
  join public.artifact_versions av on av.artifact_id = a.id
  join public.approvals ap on ap.artifact_version_id = av.id
  where a.production_id = target_production_id
    and a.artifact_type = 'ai_generation_package'
    and ap.decision = 'approved'
  order by av.version_number desc limit 1;

  if approved_package_version_id is null then
    raise exception 'An approved AI Generation Package is required';
  end if;

  select pt.id into target_task_id
  from public.production_stages ps
  join public.production_tasks pt on pt.stage_id = ps.id
  where ps.production_id = target_production_id
    and ps.stage_key = 'video_generation'
    and pt.task_key = 'complete_video_generation';

  if target_task_id is null then raise exception 'Video Generation task not found'; end if;
  if exists (select 1 from public.jobs where task_id = target_task_id and status in ('queued','running')) then
    raise exception 'Video Generation is already running';
  end if;

  insert into public.jobs (task_id, job_type, status, created_by)
  values (target_task_id, 'generate_video', 'running', auth.uid())
  returning * into created_job;

  select coalesce(max(r.attempt),0)+1 into next_attempt
  from public.runs r join public.jobs j on j.id = r.job_id
  where j.task_id = target_task_id;

  insert into public.runs (job_id, attempt, status, input)
  values (created_job.id, next_attempt, 'running', jsonb_build_object('ai_generation_package_version_id', approved_package_version_id))
  returning * into created_run;

  update public.production_stages set status='active' where production_id=target_production_id and stage_key='video_generation';
  update public.production_tasks set status='active' where id=target_task_id;
  update public.productions set state='active' where id=target_production_id and state not in ('completed','cancelled');
  insert into public.production_events (production_id,event_type,actor_id,entity_type,entity_id,payload)
  values (target_production_id,'run.started',auth.uid(),'run',created_run.id,jsonb_build_object('job_type','generate_video'));
  return created_run;
end;
$$;

create or replace function public.complete_video_generation_run(
  target_run_id uuid,
  video_url text,
  provider_name text,
  model_name text,
  output_metadata jsonb default '{}'::jsonb
)
returns public.artifact_versions
language plpgsql security invoker set search_path = public as $$
declare
  target_job_id uuid;
  target_production_id uuid;
  target_stage_id uuid;
  target_task_id uuid;
  target_artifact public.artifacts;
  created_version public.artifact_versions;
  next_version integer;
begin
  if char_length(trim(video_url)) = 0 then raise exception 'Video URL is required'; end if;

  select j.id, ps.production_id, ps.id, pt.id
  into target_job_id, target_production_id, target_stage_id, target_task_id
  from public.runs r
  join public.jobs j on j.id=r.job_id
  join public.production_tasks pt on pt.id=j.task_id
  join public.production_stages ps on ps.id=pt.stage_id
  where r.id=target_run_id and r.status='running' and j.job_type='generate_video';

  if target_job_id is null then raise exception 'Active Video Generation run not found'; end if;

  insert into public.artifacts (production_id,artifact_type,title)
  values (target_production_id,'generated_video','Generated Video')
  on conflict (production_id,artifact_type) do update set title=excluded.title
  returning * into target_artifact;

  perform 1 from public.artifacts where id=target_artifact.id for update;
  select coalesce(max(version_number),0)+1 into next_version from public.artifact_versions where artifact_id=target_artifact.id;

  insert into public.artifact_versions (artifact_id,version_number,content,created_by,source_run_id)
  values (target_artifact.id,next_version,jsonb_build_object('video_url',trim(video_url),'provider',provider_name,'model',model_name,'metadata',output_metadata),auth.uid(),target_run_id)
  returning * into created_version;

  update public.runs set status='succeeded',provider=provider_name,model=model_name,output=jsonb_build_object('artifact_version_id',created_version.id,'video_url',trim(video_url),'metadata',output_metadata),finished_at=now() where id=target_run_id;
  update public.jobs set status='succeeded' where id=target_job_id;
  update public.production_stages set status='awaiting_approval' where id=target_stage_id;
  update public.production_tasks set status='awaiting_approval' where id=target_task_id;
  update public.productions set state='awaiting_approval' where id=target_production_id;
  return created_version;
end;
$$;

create or replace function public.fail_video_generation_run(target_run_id uuid, failure jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare target_job_id uuid; target_stage_id uuid; target_task_id uuid; target_production_id uuid;
begin
  select j.id,ps.id,pt.id,ps.production_id into target_job_id,target_stage_id,target_task_id,target_production_id
  from public.runs r join public.jobs j on j.id=r.job_id join public.production_tasks pt on pt.id=j.task_id join public.production_stages ps on ps.id=pt.stage_id
  where r.id=target_run_id and r.status='running';
  if target_job_id is null then return; end if;
  update public.runs set status='failed',error=failure,finished_at=now() where id=target_run_id;
  update public.jobs set status='failed' where id=target_job_id;
  update public.production_stages set status='ready' where id=target_stage_id;
  update public.production_tasks set status='failed' where id=target_task_id;
  update public.productions set state='blocked' where id=target_production_id;
end;
$$;

create or replace function public.decide_generated_video_version(
  target_artifact_version_id uuid,
  approval_decision text,
  decision_comment text default null
)
returns public.approvals
language plpgsql security invoker set search_path = public as $$
declare created_approval public.approvals; target_production_id uuid; target_version integer; latest_version integer; target_artifact_id uuid; current_position integer;
begin
  if approval_decision not in ('approved','revision_requested') then raise exception 'Invalid decision'; end if;
  select a.production_id,a.id,av.version_number into target_production_id,target_artifact_id,target_version
  from public.artifact_versions av join public.artifacts a on a.id=av.artifact_id
  where av.id=target_artifact_version_id and a.artifact_type='generated_video';
  if target_production_id is null then raise exception 'Generated Video version not found'; end if;
  select max(version_number) into latest_version from public.artifact_versions where artifact_id=target_artifact_id;
  if target_version<>latest_version then raise exception 'Only latest Generated Video version may be decided'; end if;

  insert into public.approvals (artifact_version_id,decision,comment,decided_by)
  values (target_artifact_version_id,approval_decision,nullif(trim(decision_comment),''),auth.uid()) returning * into created_approval;

  select position into current_position from public.production_stages where production_id=target_production_id and stage_key='video_generation';
  if approval_decision='approved' then
    update public.production_stages set status='completed' where production_id=target_production_id and stage_key='video_generation';
    update public.production_tasks set status='completed' where stage_id in (select id from public.production_stages where production_id=target_production_id and stage_key='video_generation');
    update public.production_stages set status='ready' where production_id=target_production_id and position=current_position+1;
    update public.production_tasks set status='ready' where stage_id in (select id from public.production_stages where production_id=target_production_id and position=current_position+1);
    update public.productions set state='ready' where id=target_production_id;
  else
    update public.production_stages set status='ready' where production_id=target_production_id and stage_key='video_generation';
    update public.production_tasks set status='ready' where stage_id in (select id from public.production_stages where production_id=target_production_id and stage_key='video_generation');
    update public.productions set state='active' where id=target_production_id;
  end if;
  return created_approval;
end;
$$;
