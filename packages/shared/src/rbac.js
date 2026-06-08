"use strict";
/**
 * RBAC — the 13 platform user types and their fine-grained permissions.
 * Permissions are strings of the form "<resource>:<action>". Roles are bundles.
 * Guards (apps/api/src/common/rbac) check these; the UI hides what the user can't do.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.PERMISSIONS = exports.USER_ROLES = void 0;
exports.permissionsForRoles = permissionsForRoles;
exports.hasPermission = hasPermission;
exports.USER_ROLES = [
    "super_admin",
    "platform_admin",
    "org_admin",
    "dept_manager",
    "compliance_manager",
    "hr_manager",
    "trainer",
    "instructor",
    "provider",
    "partner",
    "finance_manager",
    "learner",
    "guest",
];
exports.PERMISSIONS = [
    "org:manage",
    "user:manage",
    "role:manage",
    "provider:manage",
    "catalog:read",
    "catalog:manage",
    "enrollment:read",
    "enrollment:assign",
    "skills:read",
    "skills:manage",
    "compliance:read",
    "compliance:manage",
    "certification:read",
    "certification:manage",
    "career:read",
    "career:manage",
    "recommendation:read",
    "ai:use",
    "marketplace:read",
    "marketplace:buy",
    "finance:read",
    "report:export",
    "audit:read",
];
const ALL = [...exports.PERMISSIONS];
/** Role -> granted permissions. `super_admin` gets everything. */
exports.ROLE_PERMISSIONS = {
    super_admin: ALL,
    platform_admin: ALL.filter((p) => p !== "finance:read"),
    org_admin: [
        "org:manage", "user:manage", "role:manage", "provider:manage",
        "catalog:read", "catalog:manage", "enrollment:read", "enrollment:assign",
        "skills:read", "skills:manage", "compliance:read", "compliance:manage",
        "certification:read", "certification:manage", "career:read", "career:manage",
        "recommendation:read", "ai:use", "marketplace:read", "marketplace:buy",
        "report:export", "audit:read",
    ],
    dept_manager: [
        "user:manage", "catalog:read", "enrollment:read", "enrollment:assign",
        "skills:read", "compliance:read", "certification:read", "career:read",
        "recommendation:read", "ai:use", "report:export",
    ],
    compliance_manager: [
        "catalog:read", "enrollment:read", "enrollment:assign", "skills:read",
        "compliance:read", "compliance:manage", "certification:read",
        "certification:manage", "recommendation:read", "ai:use", "report:export", "audit:read",
    ],
    hr_manager: [
        "user:manage", "catalog:read", "enrollment:read", "enrollment:assign",
        "skills:read", "skills:manage", "career:read", "career:manage",
        "certification:read", "recommendation:read", "ai:use", "report:export",
    ],
    trainer: ["catalog:read", "catalog:manage", "enrollment:read", "skills:read", "ai:use"],
    instructor: ["catalog:read", "catalog:manage", "enrollment:read", "ai:use"],
    provider: ["catalog:read", "catalog:manage", "marketplace:read"],
    partner: ["catalog:read", "marketplace:read"],
    finance_manager: ["finance:read", "marketplace:read", "report:export"],
    learner: [
        "catalog:read", "enrollment:read", "skills:read", "compliance:read",
        "certification:read", "career:read", "career:manage", "recommendation:read",
        "ai:use", "marketplace:read",
    ],
    guest: ["catalog:read"],
};
function permissionsForRoles(roles) {
    const out = new Set();
    for (const r of roles)
        for (const p of exports.ROLE_PERMISSIONS[r] ?? [])
            out.add(p);
    return out;
}
function hasPermission(roles, needed) {
    return permissionsForRoles(roles).has(needed);
}
