/**
 * Roles config — single source of truth for available user roles.
 *
 * To add a new role in the future:
 *   1. Add it to the Prisma `Role` enum in prisma/models/enums.prisma and run a migration.
 *   2. Add an entry here.
 *   3. The frontend will pick it up automatically via GET /api/super-admin/roles — no frontend code changes needed.
 */

export interface RoleDefinition {
  value: string;
  label: string;
  description: string;
}

export const ROLES: RoleDefinition[] = [
  {
    value: 'SUPER_ADMIN',
    label: 'Super Admin',
    description:
      'Full platform access. Can manage malls, admins, and all users.',
  },
  {
    value: 'ADMIN',
    label: 'Mall Admin',
    description: 'Manages a specific mall and its vendors.',
  },
  {
    value: 'VENDOR',
    label: 'Vendor',
    description: 'Manages their own menu, orders, and profile.',
  },
];

/** Helper: set of valid role values for fast validation */
export const VALID_ROLE_VALUES = new Set(ROLES.map((r) => r.value));
