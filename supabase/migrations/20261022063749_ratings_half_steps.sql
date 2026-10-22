-- Ratings in half steps (1, 1.5 … 10). Existing whole scores keep their value.
alter table public.ratings alter column score type numeric(3,1);
alter table public.ratings add constraint ratings_score_half_steps check (score * 2 = trunc(score * 2));
