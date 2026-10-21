-- [:alnum:] drops combining marks (Kannada, Hindi vowel signs), mangling non-Latin dish names.
-- Strip only whitespace and an explicit punctuation set instead. Mirrored by dishKey() in the app.
alter table public.dishes drop column name_key;

alter table public.dishes add column name_key text generated always as (
  btrim(regexp_replace(lower(name), '[[:space:]!-/:-@[-`{-~’‘“”–—…·]+', ' ', 'g'))
) stored check (name_key <> '');

alter table public.dishes add constraint dishes_restaurant_id_name_key_key unique (restaurant_id, name_key);
