import { SetMetadata } from "@nestjs/common";
import type { Permission } from "@riyada/shared";

export const PERMISSIONS_KEY = "required_permissions";

/** Guard a route: caller's roles must grant ALL listed permissions. */
export const RequirePermissions = (...perms: Permission[]) => SetMetadata(PERMISSIONS_KEY, perms);
