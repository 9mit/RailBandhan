# Historical Supabase prototype

These migrations and seed files describe an earlier Supabase-auth experiment. They are retained for historical context and are not used by the rebuilt application.

The current app uses its own users/sessions and the shared SQL repository. Its canonical schema is `apps/web/src/server/store/schema.ts`, applied with `npm run db:migrate`. Do not initialize the production Compose database from this directory.

Moving an existing Supabase deployment to this schema requires a separately designed, backed-up and rehearsed data/identity migration. The application does not claim Supabase RLS or Realtime protection for the local-auth PostgreSQL schema.
