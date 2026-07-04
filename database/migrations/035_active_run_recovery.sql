create or replace function public.get_active_production_run(
  target_production_id uuid,
  target_job_type text
)
returns public.runs
language sql
security invoker
set search_path = public
stable
as $$
  select r.*
  from public.runs r
  join public.jobs j on j.id = r.job_id
  join public.production_tasks pt on pt.id = j.task_id
  join public.production_stages ps on ps.id = pt.stage_id
  where ps.production_id = target_production_id
    and j.job_type = target_job_type
    and j.status = 'running'
    and r.status = 'running'
  order by r.started_at desc
  limit 1;
$$;
