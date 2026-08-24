create or replace function public.preserve_ipo_source_payload_enrichment()
returns trigger
language plpgsql
as $$
begin
  if old.source_payload is not null and new.source_payload is not null then
    new.source_payload := old.source_payload || new.source_payload;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_preserve_ipo_source_payload_enrichment on public.ipos;

create trigger trg_preserve_ipo_source_payload_enrichment
before update of source_payload on public.ipos
for each row
execute function public.preserve_ipo_source_payload_enrichment();
