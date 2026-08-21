do $$
declare
  v_job record;
begin
  for v_job in select jobid from cron.job where jobname = 'official-spk-ipo-sync'
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;
end $$;

select cron.schedule(
  'official-spk-ipo-sync',
  '*/5 * * * *',
  $job$select public.trigger_official_spk_sync(false, 8);$job$
);
