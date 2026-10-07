import type { Permission } from "@workspace/authz"
import type { OrganizationPermissions } from "@/lib/graphql/projections"
import { ORG_PERMISSION_KEY } from "@/lib/permissions-map"

// Client-safe navigation config. Kept out of @workspace/authz (which imports the
// OpenFGA SDK / node code) so it can be imported by client components.
// Navigation is derived from capabilities, never from a role.

export type NavItem = {
  key: string
  label: string
  href: string
  icon: string
  permission: Permission | null
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", permission: null },
  { key: "projects", label: "Projects", href: "/projects", icon: "FolderKanban", permission: "organization.view" },
  { key: "documents", label: "Documents", href: "/documents", icon: "FileText", permission: "organization.view" },
  { key: "teams", label: "Teams", href: "/teams", icon: "Users", permission: "organization.view_teams" },
  { key: "members", label: "Members", href: "/members", icon: "UserCog", permission: "organization.view_members" },
  { key: "access-requests", label: "Access Requests", href: "/access-requests", icon: "ShieldQuestion", permission: "organization.view_members" },
  { key: "settings", label: "Settings", href: "/settings", icon: "Settings", permission: "organization.manage" },
  { key: "billing", label: "Billing", href: "/billing", icon: "CreditCard", permission: "organization.manage_billing" },
  { key: "audit-logs", label: "Audit Logs", href: "/audit-logs", icon: "ScrollText", permission: "organization.view_audit_logs" },
]

export const ORG_ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
}

/**
 * Navigation projection: the sidebar items a user may see, derived purely from
 * their capabilities. This is the "which nav items are visible" rule in one
 * testable place.
 */
export function visibleNavItems(permissions: OrganizationPermissions): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (!item.permission) return true
    const key = ORG_PERMISSION_KEY[item.permission]
    return key ? permissions[key] === true : false
  })
}
