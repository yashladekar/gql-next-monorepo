// The permission catalog: the ONLY place permission strings are defined.
// Every UI check and every server check refers to a permission key from here,
// never to a role. The catalog maps a permission to the OpenFGA relation + type
// that decides it, so there is exactly one authorization source of truth.

export type ResourceType = "organization" | "team" | "project" | "document"

export const PERMISSIONS = {
  // organization
  "organization.view": { resource: "organization", relation: "can_view" },
  "organization.manage": { resource: "organization", relation: "can_manage_organization" },
  "organization.view_members": { resource: "organization", relation: "can_view_members" },
  "organization.view_teams": { resource: "organization", relation: "can_view_teams" },
  "organization.manage_members": { resource: "organization", relation: "can_manage_members" },
  "organization.manage_teams": { resource: "organization", relation: "can_manage_teams" },
  "organization.manage_billing": { resource: "organization", relation: "can_manage_billing" },
  "organization.view_audit_logs": { resource: "organization", relation: "can_view_audit_logs" },
  "organization.create_project": { resource: "organization", relation: "can_create_project" },

  // project
  "project.view": { resource: "project", relation: "can_view" },
  "project.update": { resource: "project", relation: "can_edit" },
  "project.delete": { resource: "project", relation: "can_delete" },
  "project.share": { resource: "project", relation: "can_share" },
  "project.create_document": { resource: "project", relation: "can_create_document" },
  "project.manage": { resource: "project", relation: "can_manage_project" },

  // document
  "document.view": { resource: "document", relation: "can_view" },
  "document.update": { resource: "document", relation: "can_edit" },
  "document.delete": { resource: "document", relation: "can_delete" },
  "document.share": { resource: "document", relation: "can_share" },

  // team
  "team.view": { resource: "team", relation: "can_view" },
  "team.manage": { resource: "team", relation: "can_manage_team" },
} as const satisfies Record<string, { resource: ResourceType; relation: string }>

export type Permission = keyof typeof PERMISSIONS

export function relationFor(permission: Permission): string {
  return PERMISSIONS[permission].relation
}

export function resourceFor(permission: Permission): ResourceType {
  return PERMISSIONS[permission].resource
}

// Permissions projected for an organization, used to drive navigation and
// page-level capabilities. The server computes these once per request.
export const ORGANIZATION_CAPABILITIES: Permission[] = [
  "organization.view",
  "organization.manage",
  "organization.view_members",
  "organization.view_teams",
  "organization.manage_members",
  "organization.manage_teams",
  "organization.manage_billing",
  "organization.view_audit_logs",
  "organization.create_project",
]

// Permissions projected for a single project.
export const PROJECT_PERMISSIONS: Permission[] = [
  "project.view",
  "project.update",
  "project.delete",
  "project.share",
  "project.create_document",
  "project.manage",
]

// Permissions projected for a single document.
export const DOCUMENT_PERMISSIONS: Permission[] = [
  "document.view",
  "document.update",
  "document.delete",
  "document.share",
]

export const TEAM_PERMISSIONS: Permission[] = ["team.view", "team.manage"]

