import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "/opt/lms/node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const hash = await bcrypt.hash("demo1234", 10);
const existing = await db.user.findFirstOrThrow({ where: { email: "amir@excis.com" } });
const updated = await db.user.update({
  where: { id: existing.id },
  data: { status: "active", passwordHash: hash },
});
console.log("restored:", updated.email, updated.status, !!updated.passwordHash);

// Confirm the learner role assignment exists (auth.service.ts reads roleAssignments for the JWT).
const roles = await db.roleAssignment.findMany({ where: { userId: updated.id }, include: { role: true } });
console.log("current role assignments:", roles.map((r) => r.role.key));
if (roles.length === 0) {
  const learnerRole = await db.role.findFirst({ where: { tenantId: updated.tenantId, key: "learner" } });
  if (learnerRole) {
    await db.roleAssignment.create({ data: { userId: updated.id, roleId: learnerRole.id } });
    console.log("assigned learner role");
  } else {
    console.log("no learner Role row found for this tenant — skipped");
  }
}
await db.$disconnect();
