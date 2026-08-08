begin;

create table if not exists public.comment_dislikes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_dislikes enable row level security;

create policy "comment dislikes readable"
  on public.comment_dislikes for select
  using (true);

create policy "user manages own dislikes"
  on public.comment_dislikes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke insert, update, delete on public.comment_dislikes from authenticated;

create or replace function public.toggle_comment_vote(p_comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if not exists (select 1 from public.comments where id = p_comment_id and status = 'published') then
    raise exception 'Yorum bulunamadı';
  end if;

  if exists (select 1 from public.comment_votes where comment_id = p_comment_id and user_id = auth.uid()) then
    delete from public.comment_votes where comment_id = p_comment_id and user_id = auth.uid();
    update public.comments set helpful_count = greatest(helpful_count - 1, 0), updated_at = now() where id = p_comment_id;
    return false;
  end if;

  delete from public.comment_dislikes where comment_id = p_comment_id and user_id = auth.uid();
  insert into public.comment_votes(comment_id, user_id) values (p_comment_id, auth.uid());
  update public.comments set helpful_count = helpful_count + 1, updated_at = now() where id = p_comment_id;
  return true;
end;
$$;

create or replace function public.toggle_comment_dislike(p_comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if not exists (select 1 from public.comments where id = p_comment_id and status = 'published') then
    raise exception 'Yorum bulunamadı';
  end if;

  if exists (select 1 from public.comment_dislikes where comment_id = p_comment_id and user_id = auth.uid()) then
    delete from public.comment_dislikes where comment_id = p_comment_id and user_id = auth.uid();
    return false;
  end if;

  if exists (select 1 from public.comment_votes where comment_id = p_comment_id and user_id = auth.uid()) then
    delete from public.comment_votes where comment_id = p_comment_id and user_id = auth.uid();
    update public.comments set helpful_count = greatest(helpful_count - 1, 0), updated_at = now() where id = p_comment_id;
  end if;

  insert into public.comment_dislikes(comment_id, user_id) values (p_comment_id, auth.uid());
  return true;
end;
$$;

grant execute on function public.toggle_comment_vote(uuid) to authenticated;
grant execute on function public.toggle_comment_dislike(uuid) to authenticated;

commit;
