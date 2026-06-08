-- Row-Level Security + append-only AuditLog.
-- Apply AFTER `prisma migrate` (Prisma doesn't manage RLS/triggers). Run as the DB owner:
--   psql "$DATABASE_URL" -f packages/database/prisma/sql/rls-and-audit.sql
--
-- The app sets `app.tenant_id` per request (see packages/database withTenantRls). Policies below
-- scope every tenant table to that GUC, so a query that forgets to filter by tenant returns
-- nothing instead of leaking across tenants. This is defense-in-depth behind the app-layer
-- tenant context — not a replacement for it.

-- 1) RLS on every tenant-scoped table. Add new tables here when the schema grows.
DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'Organization','Division','Department','Team','User','Role',
    'Skill','JobRole','UserSkill','ProviderConnection','Course','LearningPath',
    'Enrollment','Assessment','AssessmentAttempt','Certification','EarnedCertificate',
    'ComplianceFramework','ComplianceAssignment','CareerPath','CareerPlan','Recommendation',
    'Product','Subscription','Order','Payment','Notification','AuditLog'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    -- Tables with a direct tenantId column get a direct policy.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = t AND column_name = 'tenantId'
    ) THEN
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %I USING ("tenantId" = current_setting(''app.tenant_id'', true));',
        t
      );
    END IF;
  END LOOP;
END $$;

-- 2) AuditLog is append-only: block UPDATE and DELETE at the database level.
CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only (% not permitted)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

-- 3) Helpful covering indexes for the hot intelligence paths (idempotent).
CREATE INDEX IF NOT EXISTS idx_earnedcert_expires ON "EarnedCertificate" ("expiresAt");
CREATE INDEX IF NOT EXISTS idx_compliance_status ON "ComplianceAssignment" ("tenantId","status");
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON "Enrollment" ("tenantId","status");
