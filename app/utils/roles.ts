/**
 * Role checking utilities
 * Normalizes role comparisons to be case-insensitive
 */

export type UserRole = "ADMIN" | "USER" | "admin" | "user";

interface UserWithRole {
  role?: string | null;
}

/**
 * Check if a user has admin role (case-insensitive)
 */
export function isAdmin(user: UserWithRole | null | undefined): boolean {
  if (!user?.role) return false;
  return user.role.toLowerCase() === "admin";
}

/**
 * Check if a user has a specific role (case-insensitive)
 */
export function hasRole(user: UserWithRole | null | undefined, role: string): boolean {
  if (!user?.role) return false;
  return user.role.toLowerCase() === role.toLowerCase();
}
