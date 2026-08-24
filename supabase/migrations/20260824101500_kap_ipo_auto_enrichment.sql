create or replace function public.trigger_kap_ipo_enrich(
  p_dry_run boolean default true,
  p_max_ipos integer default 8
)
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
  v_request_id bigint;
begin
  select secret_value into v_secret
  from public.ipo_sync_control
  where id = true;

  if v_secret is null then
    raise exception 'sync secret unavailable';
  end if;

  select net.http_post(
    url := 'https://yjffzuzldlchswaohwyk.supabase.co/functions/v1/kap-ipo-enrich',
    body := jsonb_build_object(
      'dryRun', p_dry_run,
      'maxIpos', greatest(1, least(25, p_max_ipos))
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', v_secret
    ),
    timeout_milliseconds := 60000
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.trigger_kap_ipo_enrich(boolean, integer) from public, anon, authenticated;
grant execute on function public.trigger_kap_ipo_enrich(boolean, integer) to postgres, service_role;

do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid
  from cron.job
  where jobname = 'official-kap-ipo-enrich'
  limit 1;

  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;

  perform cron.schedule(
    'official-kap-ipo-enrich',
    '*/30 * * * *',
    'select public.trigger_kap_ipo_enrich(false, 8);'
  );
end;
$$;
