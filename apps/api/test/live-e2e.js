/**
 * Live end-to-end proof WITHOUT a network socket: boots the real Nest DI container
 * (createApplicationContext — no HTTP listener), resolves the actual domain services, and invokes
 * them inside a tenant context against the seeded Postgres. Exercises the full
 * service → Prisma 7 (driver adapter) → Postgres → intelligence-engine path with real data, then
 * exits. Single foreground process. Run with the demo ids in env.
 */
require("reflect-metadata");
const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../dist/app.module");
const { SkillsService } = require("../dist/modules/skills/skills.service");
const { ComplianceService } = require("../dist/modules/compliance/compliance.service");
const { CertificationService } = require("../dist/modules/certification/certification.service");
const { RecommendationsService } = require("../dist/modules/recommendations/recommendations.service");
const { WorkforceService } = require("../dist/modules/workforce/workforce.service");
const { runWithTenant } = require("@riyada/shared");

const { T, O, U, ROLE, DEPT } = process.env;
const show = (label, v) => console.log(`\n════ ${label} ════\n` + JSON.stringify(v, null, 1));

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const skills = app.get(SkillsService);
  const compliance = app.get(ComplianceService);
  const certs = app.get(CertificationService);
  const recs = app.get(RecommendationsService);
  const workforce = app.get(WorkforceService);

  await runWithTenant({ tenantId: T, organizationId: O, userId: U, roles: ["org_admin"] }, async () => {
    show("SKILL-GAP (service→Prisma→Postgres→intelligence)", await skills.getSkillGap(U, ROLE));
    show("COMPLIANCE DASHBOARD", await compliance.departmentDashboard(DEPT));
    show("CERTIFICATIONS EXPIRING", await certs.expiring(90));
    show("RECOMMENDATIONS (generated + persisted)", await recs.generateForUser(U, ROLE));
    show("WORKFORCE READINESS", await workforce.departmentReadiness(DEPT, ROLE));
  });

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error("E2E FAILED:", e); process.exit(1); });
