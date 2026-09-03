import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const amir = await db.user.findFirstOrThrow({ where: { email: "amir@excis.com" } });
const orgAdminRole = await db.role.findFirstOrThrow({ where: { tenantId: amir.tenantId, key: "org_admin" } });

const existing = await db.roleAssignment.findFirst({ where: { userId: amir.id, roleId: orgAdminRole.id } });
if (!existing) {
  await db.roleAssignment.create({ data: { userId: amir.id, roleId: orgAdminRole.id } });
  console.log("granted org_admin to amir@excis.com");
} else {
  console.log("already has org_admin");
}
const roles = await db.roleAssignment.findMany({ where: { userId: amir.id }, include: { role: true } });
console.log("roles now:", roles.map((r) => r.role.key));
await db.$disconnect();
