create or replace function public.admin_event_kpis(from_ts timestamptz default null, to_ts timestamptz default null)
returns table (
  views bigint,
  leads bigint,
  saves bigint
)
language sql
stable
as $$
  select
    count(*) filter (where event_type = 'view') as views,
    count(*) filter (where event_type = 'lead') as leads,
    count(*) filter (where event_type = 'save_contact') as saves
  from public.card_events
  where (from_ts is null or created_at >= from_ts)
    and (to_ts is null or created_at < to_ts);
$$;

create or replace function public.admin_event_chart(from_ts timestamptz default null, to_ts timestamptz default null)
returns table (
  date text,
  views bigint,
  leads bigint,
  saves bigint
)
language sql
stable
as $$
  select
    to_char(date_trunc('day', created_at at time zone 'utc'), 'YYYY-MM-DD') as date,
    count(*) filter (where event_type = 'view') as views,
    count(*) filter (where event_type = 'lead') as leads,
    count(*) filter (where event_type = 'save_contact') as saves
  from public.card_events
  where (from_ts is null or created_at >= from_ts)
    and (to_ts is null or created_at < to_ts)
  group by 1
  order by 1 asc;
$$;
