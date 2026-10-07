import type { Permission } from "@workspace/authz"
import type {
  DocumentPermissions,
  OrganizationPermissions,
  ProjectPermissions,
} from "@/lib/graphql/projections"

// Maps a public permission key to the field name used in the server-computed
// projection objects. Keeping this in one place means `<Can>` can accept a
// permission string while the projections stay ergonomic.

export const ORG_PERMISSION_KEY: Partial<Record<Permission, keyof OrganizationPermissions>> = {
  "organization.view": "canView",
  "organization.manage": "canManage",
  "organization.view_members": "canViewMembers",
  "organization.view_teams": "canViewTeams",
  "organization.manage_members": "canManageMembers",
  "organization.manage_teams": "canManageTeams",
  "organization.manage_billing": "canManageBilling",
  "organization.view_audit_logs": "canViewAuditLogs",
  "organization.create_project": "canCreateProject",
}

export const PROJECT_PERMISSION_KEY: Partial<Record<Permission, keyof ProjectPermissions>> = {
  "project.view": "canRead",
  "project.update": "canUpdate",
  "project.delete": "canDelete",
  "project.share": "canShare",
  "project.create_document": "canCreateDocument",
  "project.manage": "canManage",
}

export const DOCUMENT_PERMISSION_KEY: Partial<Record<Permission, keyof DocumentPermissions>> = {
  "document.view": "canRead",
  "document.update": "canUpdate",
  "document.delete": "canDelete",
  "document.share": "canShare",
}

export function resolveOnProjection(
  permission: Permission,
  projection: Record<string, boolean>,
): boolean {
  const key =
    PROJECT_PERMISSION_KEY[permission] ??
    DOCUMENT_PERMISSION_KEY[permission] ??
    ORG_PERMISSION_KEY[permission]
  return key ? projection[key] === true : false
}
