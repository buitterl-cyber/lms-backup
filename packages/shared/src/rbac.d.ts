/**
 * RBAC — the 13 platform user types and their fine-grained permissions.
 * Permissions are strings of the form "<resource>:<action>". Roles are bundles.
 * Guards (apps/api/src/common/rbac) check these; the UI hides what the user can't do.
 */
export declare const USER_ROLES: readonly ["super_admin", "platform_admin", "org_admin", "dept_manager", "compliance_manager", "hr_manager", "trainer", "instructor", "provider", "partner", "finance_manager", "learner", "guest"];
export type UserRoleKey = (typeof USER_ROLES)[number];
export declare const PERMISSIONS: readonly ["org:manage", "user:manage", "role:manage", "provider:manage", "catalog:read", "catalog:manage", "enrollment:read", "enrollment:assign", "skills:read", "skills:manage", "compliance:read", "compliance:manage", "certification:read", "certification:manage", "career:read", "career:manage", "recommendation:read", "ai:use", "marketplace:read", "marketplace:buy", "finance:read", "report:export", "audit:read"];
export type Permission = (typeof PERMISSIONS)[number];
/** Role -> granted permissions. `super_admin` gets everything. */
export declare const ROLE_PERMISSIONS: Record<UserRoleKey, Permission[]>;
export declare function permissionsForRoles(roles: UserRoleKey[]): Set<Permission>;
export declare function hasPermission(roles: UserRoleKey[], needed: Permission): boolean;
