-- Daily cron: ensure windows + settle due tournaments.
select cron.schedule(
  'goplay-runner-daily',
  '15 0 * * *',
  $$ select public.ensure_runner_tournaments(); select public.settle_due_runner_tournaments(); $$
);
