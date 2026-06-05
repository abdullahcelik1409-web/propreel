-- Supabase hardening for Prisma's migration history table.
-- Prisma creates this table during migrate deploy, so it is secured in a follow-up migration.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "_prisma_migrations" FROM anon, authenticated;
