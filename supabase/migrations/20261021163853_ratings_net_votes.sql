-- The API can only sort by columns, so store Facts minus Cap for the Top feed.
alter table public.ratings add column net_votes integer generated always as (facts_count - cap_count) stored;

drop index public.ratings_top_idx;
create index ratings_top_idx on public.ratings (net_votes desc, created_at desc) where take is not null;
