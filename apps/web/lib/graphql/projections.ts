import {
  batchCheck,
  listAccessibleIds,
  projectPermissions as permissionMap,
  type Permission,
  type Subject,
} from "@workspace/authz"

// The `permissions` objects the frontend consumes. They are computed server-side
// from OpenFGA; the UI never derives them and never receives unauthorized data.

export type ProjectPermissions = {
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  canShare: boolean
  canCreateDocument: boolean
  canManage: boolean
}

export type DocumentPermissions = {
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
  canShare: boolean
}

export type OrganizationPermissions = {
  canView: boolean
  canManage: boolean
  canViewMembers: boolean
  canViewTeams: boolean
  canManageMembers: boolean
  canManageTeams: boolean
  canManageBilling: boolean
  canViewAuditLogs: boolean
  canCreateProject: boolean
}

const PROJECT_FIELDS: [keyof ProjectPermissions, Permission][] = [
  ["canRead", "project.view"],
  ["canUpdate", "project.update"],
  ["canDelete", "project.delete"],
  ["canShare", "project.share"],
  ["canCreateDocument", "project.create_document"],
  ["canManage", "project.manage"],
]

const DOCUMENT_FIELDS: [keyof DocumentPermissions, Permission][] = [
  ["canRead", "document.view"],
  ["canUpdate", "document.update"],
  ["canDelete", "document.delete"],
  ["canShare", "document.share"],
]

const ORG_FIELDS: [keyof OrganizationPermissions, Permission][] = [
  ["canView", "organization.view"],
  ["canManage", "organization.manage"],
  ["canViewMembers", "organization.view_members"],
  ["canViewTeams", "organization.view_teams"],
  ["canManageMembers", "organization.manage_members"],
  ["canManageTeams", "organization.manage_teams"],
  ["canManageBilling", "organization.manage_billing"],
  ["canViewAuditLogs", "organization.view_audit_logs"],
  ["canCreateProject", "organization.create_project"],
]

export const EMPTY_PROJECT_PERMISSIONS: ProjectPermissions = {
  canRead: false,
  canUpdate: false,
  canDelete: false,
  canShare: false,
  canCreateDocument: false,
  canManage: false,
}

export const EMPTY_DOCUMENT_PERMISSIONS: DocumentPermissions = {
  canRead: false,
  canUpdate: false,
  canDelete: false,
  canShare: false,
}

export const EMPTY_ORG_PERMISSIONS: OrganizationPermissions = {
  canView: false,
  canManage: false,
  canViewMembers: false,
  canViewTeams: false,
  canManageMembers: false,
  canManageTeams: false,
  canManageBilling: false,
  canViewAuditLogs: false,
  canCreateProject: false,
}

/**
 * One BatchCheck round trip for every (project, permission) pair, instead of
 * N separate Check calls. Returns a map keyed by project id.
 */
export async function loadProjectPermissions(
  subject: Subject | null,
  projectIds: string[],
): Promise<Map<string, ProjectPermissions>> {
  const map = new Map<string, ProjectPermissions>()
  if (!subject || projectIds.length === 0) {
    for (const id of projectIds) map.set(id, EMPTY_PROJECT_PERMISSIONS)
    return map
  }

  const checks = projectIds.flatMap((id) =>
    PROJECT_FIELDS.map(([, permission]) => ({ permission, resourceId: id })),
  )
  const results = await batchCheck(subject, checks)

  projectIds.forEach((id, index) => {
    const perms = { ...EMPTY_PROJECT_PERMISSIONS }
    PROJECT_FIELDS.forEach(([field], offset) => {
      perms[field] = results[index * PROJECT_FIELDS.length + offset] ?? false
    })
    map.set(id, perms)
  })
  return map
}

export async function loadDocumentPermissions(
  subject: Subject | null,
  documentIds: string[],
): Promise<Map<string, DocumentPermissions>> {
  const map = new Map<string, DocumentPermissions>()
  if (!subject || documentIds.length === 0) {
    for (const id of documentIds) map.set(id, EMPTY_DOCUMENT_PERMISSIONS)
    return map
  }

  const checks = documentIds.flatMap((id) =>
    DOCUMENT_FIELDS.map(([, permission]) => ({ permission, resourceId: id })),
  )
  const results = await batchCheck(subject, checks)

  documentIds.forEach((id, index) => {
    const perms = { ...EMPTY_DOCUMENT_PERMISSIONS }
    DOCUMENT_FIELDS.forEach(([field], offset) => {
      perms[field] = results[index * DOCUMENT_FIELDS.length + offset] ?? false
    })
    map.set(id, perms)
  })
  return map
}

/** One ListRelations call for a single organization. */
export async function loadOrganizationPermissions(
  subject: Subject | null,
  organizationId: string,
): Promise<OrganizationPermissions> {
  if (!subject) return EMPTY_ORG_PERMISSIONS
  const raw = await permissionMap(
    subject,
    "organization",
    organizationId,
    ORG_FIELDS.map(([, permission]) => permission),
  )
  const perms = { ...EMPTY_ORG_PERMISSIONS }
  for (const [field, permission] of ORG_FIELDS) {
    perms[field] = raw[permission] ?? false
  }
  return perms
}

/**
 * Row-level filtering: the ids of resources the subject may reach, resolved by a
 * single ListObjects call. Feed straight into a Prisma `WHERE id IN (...)`.
 */
export async function accessibleIds(
  subject: Subject | null,
  permission: Permission,
): Promise<string[]> {
  if (!subject) return []
  return listAccessibleIds(subject, permission)
}
