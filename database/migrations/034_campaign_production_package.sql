create or replace function public.assemble_campaign_production_package(
  target_production_id uuid,
  deployment_channels text,
  campaign_url text default null,
  deployment_notes text default null
)
returns public.artifact_versions
language plpgsql security invoker set search_path = public as $$
declare
  approved_delivery_version_id uuid;
  approved_master_version_id uuid;
  approved_video_version_id uuid;
  target_stage_id uuid;
  target_task_id uuid;
  target_artifact public.artifacts;
  created_version public.artifact_versions;
  next_version integer;
  approved_sources jsonb;
begin
  if char_length(trim(deployment_channels)) = 0 then raise exception 'Deployment channels are required'; end if;

  select av.id into approved_delivery_version_id
  from public.artifacts a join public.artifact_versions av on av.artifact_id=a.id
  join public.approvals ap on ap.artifact_version_id=av.id
  where a.production_id=target_production_id and a.artifact_type='delivery_package' and ap.decision='approved'
  order by av.version_number desc limit 1;

  if approved_delivery_version_id is null then raise exception 'An approved Delivery Package is required'; end if;

  select av.id into approved_master_version_id
  from public.artifacts a join public.artifact_versions av on av.artifact_id=a.id
  join public.approvals ap on ap.artifact_version_id=av.id
  where a.production_id=target_production_id and a.artifact_type='post_production_master' and ap.decision='approved'
  order by av.version_number desc limit 1;

  select av.id into approved_video_version_id
  from public.artifacts a join public.artifact_versions av on av.artifact_id=a.id
  join public.approvals ap on ap.artifact_version_id=av.id
  where a.production_id=target_production_id and a.artifact_type='generated_video' and ap.decision='approved'
  order by av.version_number desc limit 1;

  select ps.id, pt.id into target_stage_id, target_task_id
  from public.production_stages ps join public.production_tasks pt on pt.stage_id=ps.id
  where ps.production_id=target_production_id and ps.stage_key='production_package' and pt.task_key='assemble_production_package';

  if target_task_id is null then raise exception 'Production Package task not found'; end if;

  select coalesce(jsonb_object_agg(source.artifact_type, source.version_id), '{}'::jsonb)
  into approved_sources
  from (
    select distinct on (a.artifact_type) a.artifact_type, av.id as version_id
    from public.artifacts a
    join public.artifact_versions av on av.artifact_id=a.id
    join public.approvals ap on ap.artifact_version_id=av.id and ap.decision='approved'
    where a.production_id=target_production_id and a.artifact_type <> 'production_package'
    order by a.artifact_type, av.version_number desc
  ) source;

  insert into public.artifacts (production_id,artifact_type,title)
  values (target_production_id,'production_package','Campaign Deployment & Production Package')
  on conflict (production_id,artifact_type) do update set title=excluded.title
  returning * into target_artifact;

  perform 1 from public.artifacts where id=target_artifact.id for update;
  select coalesce(max(version_number),0)+1 into next_version from public.artifact_versions where artifact_id=target_artifact.id;

  insert into public.artifact_versions (artifact_id,version_number,content,created_by)
  values (
    target_artifact.id,
    next_version,
    jsonb_build_object(
      'package_type','campaign_deployment',
      'deployment_channels',trim(deployment_channels),
      'campaign_url',nullif(trim(campaign_url),''),
      'deployment_notes',nullif(trim(deployment_notes),''),
      'delivery_package_version_id',approved_delivery_version_id,
      'post_production_master_version_id',approved_master_version_id,
      'generated_video_version_id',approved_video_version_id,
      'approved_source_versions',approved_sources,
      'assembled_at',now()
    ),
    auth.uid()
  ) returning * into created_version;

  update public.production_stages set status='awaiting_approval' where id=target_stage_id;
  update public.production_tasks set status='awaiting_approval' where id=target_task_id;
  update public.productions set state='awaiting_approval' where id=target_production_id;
  insert into public.production_events (production_id,event_type,actor_id,entity_type,entity_id,payload)
  values (target_production_id,'production_package.assembled',auth.uid(),'artifact_version',created_version.id,jsonb_build_object('version_number',next_version,'package_type','campaign_deployment'));
  return created_version;
end;
$$;

create or replace function public.decide_campaign_production_package_version(
  target_artifact_version_id uuid,
  approval_decision text,
  decision_comment text default null
)
returns public.approvals
language plpgsql security invoker set search_path = public as $$
declare
  created_approval public.approvals;
  target_production_id uuid;
  target_artifact_id uuid;
  target_version integer;
  latest_version integer;
begin
  if approval_decision not in ('approved','revision_requested') then raise exception 'Invalid decision'; end if;

  select a.production_id,a.id,av.version_number into target_production_id,target_artifact_id,target_version
  from public.artifact_versions av join public.artifacts a on a.id=av.artifact_id
  where av.id=target_artifact_version_id and a.artifact_type='production_package'
    and av.content->>'package_type'='campaign_deployment';

  if target_production_id is null then raise exception 'Campaign Production Package version not found'; end if;
  select max(version_number) into latest_version from public.artifact_versions where artifact_id=target_artifact_id;
  if target_version<>latest_version then raise exception 'Only the latest Campaign Production Package may be decided'; end if;

  insert into public.approvals (artifact_version_id,decision,comment,decided_by)
  values (target_artifact_version_id,approval_decision,nullif(trim(decision_comment),''),auth.uid())
  returning * into created_approval;

  if approval_decision='approved' then
    update public.production_stages set status='completed' where production_id=target_production_id and stage_key='production_package';
    update public.production_tasks set status='completed' where stage_id in (select id from public.production_stages where production_id=target_production_id and stage_key='production_package');
    update public.productions set state='completed', completed_at=now() where id=target_production_id;
    insert into public.production_events (production_id,event_type,actor_id,entity_type,entity_id,payload)
    values (target_production_id,'production.completed',auth.uid(),'production',target_production_id,jsonb_build_object('production_package_version_id',target_artifact_version_id));
  else
    update public.production_stages set status='ready' where production_id=target_production_id and stage_key='production_package';
    update public.production_tasks set status='ready' where stage_id in (select id from public.production_stages where production_id=target_production_id and stage_key='production_package');
    update public.productions set state='active' where id=target_production_id;
  end if;
  return created_approval;
end;
$$;
