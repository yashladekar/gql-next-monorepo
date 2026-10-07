import type {
  DocumentPermissions,
  OrganizationPermissions,
  ProjectPermissions,
} from "../projections"
import { builder, requirePerm } from "../builder"
import { accessibleIds, loadDocumentPermissions, loadProjectPermissions } from "../projections"
import { forbid } from "../context"

// ---------------------------------------------------------------------------
// Parent shapes returned by resolvers
// ---------------------------------------------------------------------------

export type UserShape = { id: string; name: string; email: string; image: string | null }

export type OrganizationSummaryShape = { id: string; name: string; slug: string }

export type OrganizationShape = OrganizationSummaryShape & {
  billingEmail: string | null
  plan: string
  monthlyRevenue: number
  createdAt: Date
  permissions: OrganizationPermissions
}

export type MembershipShape = { id: string; role: string; createdAt: Date; user: UserShape }

export type TeamShape = { id: string; name: string; organizationId: string }

export type ProjectShape = {
  id: string
  name: string
  description: string | null
  archived: boolean
  createdAt: Date
  permissions: ProjectPermissions
}

export type DocumentShape = {
  id: string
  projectId: string
  title: string
  body: string
  createdAt: Date
  permissions: DocumentPermissions
}

export type AccessRequestShape = {
  id: string
  resourceType: string
  resourceId: string
  requestedRelation: string
  message: string | null
  status: string
  createdAt: Date
  user: UserShape
}

export type AuditLogShape = {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  metadata: unknown
  createdAt: Date
  actor: UserShape
}

export type DashboardShape = {
  visibleProjects: number
  visibleDocuments: number
  members: number | null
  auditEvents: number | null
  monthlyRevenue: number | null
}

// ---------------------------------------------------------------------------
// Object types
// ---------------------------------------------------------------------------

export const UserRef = builder.objectRef<UserShape>("User")
UserRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    image: t.exposeString("image", { nullable: true }),
  }),
})

export const OrganizationSummaryRef = builder.objectRef<OrganizationSummaryShape>("OrganizationSummary")
OrganizationSummaryRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
  }),
})

export const OrganizationPermissionsRef =
  builder.objectRef<OrganizationPermissions>("OrganizationPermissions")
OrganizationPermissionsRef.implement({
  fields: (t) => ({
    canView: t.exposeBoolean("canView"),
    canManage: t.exposeBoolean("canManage"),
    canViewMembers: t.exposeBoolean("canViewMembers"),
    canViewTeams: t.exposeBoolean("canViewTeams"),
    canManageMembers: t.exposeBoolean("canManageMembers"),
    canManageTeams: t.exposeBoolean("canManageTeams"),
    canManageBilling: t.exposeBoolean("canManageBilling"),
    canViewAuditLogs: t.exposeBoolean("canViewAuditLogs"),
    canCreateProject: t.exposeBoolean("canCreateProject"),
  }),
})

export const ProjectPermissionsRef = builder.objectRef<ProjectPermissions>("ProjectPermissions")
ProjectPermissionsRef.implement({
  fields: (t) => ({
    canRead: t.exposeBoolean("canRead"),
    canUpdate: t.exposeBoolean("canUpdate"),
    canDelete: t.exposeBoolean("canDelete"),
    canShare: t.exposeBoolean("canShare"),
    canCreateDocument: t.exposeBoolean("canCreateDocument"),
    canManage: t.exposeBoolean("canManage"),
  }),
})

export const DocumentPermissionsRef = builder.objectRef<DocumentPermissions>("DocumentPermissions")
DocumentPermissionsRef.implement({
  fields: (t) => ({
    canRead: t.exposeBoolean("canRead"),
    canUpdate: t.exposeBoolean("canUpdate"),
    canDelete: t.exposeBoolean("canDelete"),
    canShare: t.exposeBoolean("canShare"),
  }),
})

export const TeamRef = builder.objectRef<TeamShape>("Team")
TeamRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    organizationId: t.exposeID("organizationId"),
  }),
})

export const MembershipRef = builder.objectRef<MembershipShape>("Membership")
MembershipRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    role: t.exposeString("role"),
    userId: t.field({ type: "ID", resolve: (membership) => membership.user.id }),
    user: t.field({ type: UserRef, resolve: (membership) => membership.user }),
  }),
})

export const AccessRequestRef = builder.objectRef<AccessRequestShape>("AccessRequest")
AccessRequestRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    resourceType: t.exposeString("resourceType"),
    resourceId: t.exposeID("resourceId"),
    requestedRelation: t.exposeString("requestedRelation"),
    message: t.exposeString("message", { nullable: true }),
    status: t.exposeString("status"),
    createdAt: t.field({ type: "DateTime", resolve: (request) => request.createdAt }),
    user: t.field({ type: UserRef, resolve: (request) => request.user }),
  }),
})

export const AuditLogRef = builder.objectRef<AuditLogShape>("AuditLog")
AuditLogRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    action: t.exposeString("action"),
    resourceType: t.exposeString("resourceType"),
    resourceId: t.exposeString("resourceId", { nullable: true }),
    metadata: t.field({ type: "JSON", resolve: (log) => log.metadata }),
    createdAt: t.field({ type: "DateTime", resolve: (log) => log.createdAt }),
    actor: t.field({ type: UserRef, resolve: (log) => log.actor }),
  }),
})

export const DashboardRef = builder.objectRef<DashboardShape>("Dashboard")
DashboardRef.implement({
  fields: (t) => ({
    visibleProjects: t.exposeInt("visibleProjects"),
    visibleDocuments: t.exposeInt("visibleDocuments"),
    members: t.exposeInt("members", { nullable: true }),
    auditEvents: t.exposeInt("auditEvents", { nullable: true }),
    monthlyRevenue: t.exposeInt("monthlyRevenue", { nullable: true }),
  }),
})

export const ProjectRef = builder.objectRef<ProjectShape>("Project")
ProjectRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    archived: t.exposeBoolean("archived"),
    createdAt: t.field({ type: "DateTime", resolve: (project) => project.createdAt }),
    permissions: t.field({ type: ProjectPermissionsRef, resolve: (project) => project.permissions }),
    documents: t.field({
      type: [DocumentRef],
      authScopes: (project) => requirePerm("project.view", project.id),
      resolve: async (project, _args, ctx) => {
        // Row-level filter: only documents the subject may view, intersected
        // with this project's documents.
        const documentIds = await accessibleIds(ctx.subject, "document.view")
        const rows = await ctx.prisma.document.findMany({
          where: { projectId: project.id, id: { in: documentIds } },
          orderBy: { createdAt: "asc" },
        })
        const permissions = await loadDocumentPermissions(
          ctx.subject,
          rows.map((row) => row.id),
        )
        return rows.map((row) => ({
          id: row.id,
          projectId: row.projectId,
          title: row.title,
          body: row.body,
          createdAt: row.createdAt,
          permissions: permissions.get(row.id)!,
        }))
      },
    }),
  }),
})

export const DocumentRef = builder.objectRef<DocumentShape>("Document")
DocumentRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    projectId: t.exposeID("projectId"),
    title: t.exposeString("title"),
    body: t.exposeString("body", {
      authScopes: (document) => requirePerm("document.view", document.id),
    }),
    createdAt: t.field({ type: "DateTime", resolve: (document) => document.createdAt }),
    permissions: t.field({ type: DocumentPermissionsRef, resolve: (document) => document.permissions }),
    project: t.field({
      type: ProjectRef,
      authScopes: (document) => requirePerm("document.view", document.id),
      resolve: async (document, _args, ctx) => {
        const row = await ctx.prisma.project.findUnique({ where: { id: document.projectId } })
        if (!row) forbid("Project not found")
        const perms = await loadProjectPermissions(ctx.subject, [row.id])
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          archived: row.archived,
          createdAt: row.createdAt,
          permissions: perms.get(row.id)!,
        }
      },
    }),
  }),
})

export const OrganizationRef = builder.objectRef<OrganizationShape>("Organization")
OrganizationRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    slug: t.exposeString("slug"),
    plan: t.exposeString("plan"),
    permissions: t.field({ type: OrganizationPermissionsRef, resolve: (org) => org.permissions }),

    // --- Field-level authorization: sensitive fields are gated by OpenFGA. ---
    billingEmail: t.exposeString("billingEmail", {
      nullable: true,
      authScopes: (org) => requirePerm("organization.manage_billing", org.id),
    }),
    monthlyRevenue: t.exposeInt("monthlyRevenue", {
      authScopes: (org) => requirePerm("organization.manage_billing", org.id),
    }),

    members: t.field({
      type: [MembershipRef],
      authScopes: (org) => requirePerm("organization.view_members", org.id),
      resolve: async (org, _args, ctx) => {
        const rows = await ctx.prisma.membership.findMany({
          where: { organizationId: org.id },
          include: { user: true },
          orderBy: { createdAt: "asc" },
        })
        return rows.map((row) => ({
          id: row.id,
          role: row.role,
          createdAt: row.createdAt,
          user: row.user,
        }))
      },
    }),

    teams: t.field({
      type: [TeamRef],
      authScopes: (org) => requirePerm("organization.view_teams", org.id),
      resolve: (org, _args, ctx) =>
        ctx.prisma.team.findMany({ where: { organizationId: org.id }, orderBy: { name: "asc" } }),
    }),

    auditLogs: t.field({
      type: [AuditLogRef],
      authScopes: (org) => requirePerm("organization.view_audit_logs", org.id),
      resolve: (org, _args, ctx) =>
        ctx.prisma.auditLog
          .findMany({
            where: { organizationId: org.id },
            include: { actor: true },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
          .then((rows) =>
            rows.map((row) => ({
              id: row.id,
              action: row.action,
              resourceType: row.resourceType,
              resourceId: row.resourceId,
              metadata: row.metadata,
              createdAt: row.createdAt,
              actor: row.actor,
            })),
          ),
    }),
  }),
})
