import "./scalars"
import { type Document, type Prisma, type Project } from "@workspace/db"
import {
  deleteTuples,
  deleteTuplesForObject,
  requirePermission,
  resourceObject,
  setMemberRole,
  userSubject,
  writeTuples,
  type FgaTuple,
} from "@workspace/authz"
import { builder, requirePerm } from "./builder"
import { forbid, type GraphQLContext } from "./context"
import {
  accessibleIds,
  loadDocumentPermissions,
  loadOrganizationPermissions,
  loadProjectPermissions,
  type DocumentPermissions,
  type ProjectPermissions,
} from "./projections"
import {
  AccessRequestRef,
  AuditLogRef,
  DashboardRef,
  DocumentRef,
  MembershipRef,
  OrganizationRef,
  OrganizationSummaryRef,
  ProjectRef,
  TeamRef,
  UserRef,
  type AccessRequestShape,
  type DocumentShape,
  type ProjectShape,
} from "./types/objects"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toProjectShape(project: Project, permissions: ProjectPermissions): ProjectShape {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    archived: project.archived,
    createdAt: project.createdAt,
    permissions,
  }
}

function toDocumentShape(document: Document, permissions: DocumentPermissions): DocumentShape {
  return {
    id: document.id,
    projectId: document.projectId,
    title: document.title,
    body: document.body,
    createdAt: document.createdAt,
    permissions,
  }
}

type AuditEntry = {
  organizationId: string
  action: string
  resourceType: string
  resourceId?: string | null
  metadata?: Record<string, unknown>
}

async function logAudit(ctx: GraphQLContext, entry: AuditEntry): Promise<void> {
  if (!ctx.userId) return
  await ctx.prisma.auditLog.create({
    data: {
      organizationId: entry.organizationId,
      actorId: ctx.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
    },
  })
}

const ORG_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const
type OrgRoleValue = (typeof ORG_ROLES)[number]

const OrgRoleEnum = builder.enumType("OrgRole", { values: ORG_ROLES })

const ROLE_TO_RELATION: Record<OrgRoleValue, "owner" | "admin" | "member"> = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
}

const ProjectInput = builder.inputType("ProjectInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string(),
  }),
})

const DocumentInput = builder.inputType("DocumentInput", {
  fields: (t) => ({
    title: t.string({ required: true }),
    body: t.string(),
  }),
})

const InviteMemberInput = builder.inputType("InviteMemberInput", {
  fields: (t) => ({
    email: t.string({ required: true }),
    name: t.string(),
    role: t.field({ type: OrgRoleEnum, required: true }),
  }),
})

const AccessRequestInput = builder.inputType("AccessRequestInput", {
  fields: (t) => ({
    organizationId: t.id({ required: true }),
    resourceType: t.string({ required: true }),
    resourceId: t.id({ required: true }),
    requestedRelation: t.string({ required: true }),
    message: t.string(),
  }),
})

const UpdateOrganizationInput = builder.inputType("UpdateOrganizationInput", {
  fields: (t) => ({ name: t.string({ required: true }) }),
})

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

builder.queryType({
  fields: (t) => ({
    viewer: t.field({
      type: UserRef,
      nullable: true,
      authScopes: { loggedIn: true },
      resolve: (_parent, _args, ctx) => ctx.user,
    }),

    organizations: t.field({
      type: [OrganizationSummaryRef],
      authScopes: { loggedIn: true },
      resolve: async (_parent, _args, ctx) => {
        const ids = await accessibleIds(ctx.subject, "organization.view")
        return ctx.prisma.organization.findMany({
          where: { id: { in: ids } },
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true },
        })
      },
    }),

    organization: t.field({
      type: OrganizationRef,
      nullable: true,
      args: { id: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.view", String(args.id)),
      resolve: async (_parent, args, ctx) => {
        const id = String(args.id)
        const org = await ctx.prisma.organization.findUnique({ where: { id } })
        if (!org) return null
        const permissions = await loadOrganizationPermissions(ctx.subject, id)
        return { ...org, permissions }
      },
    }),

    projects: t.field({
      type: [ProjectRef],
      args: { organizationId: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.view", String(args.organizationId)),
      resolve: async (_parent, args, ctx) => {
        const organizationId = String(args.organizationId)
        // Row-level: only ids the subject may view, enforced by OpenFGA.
        const accessible = await accessibleIds(ctx.subject, "project.view")
        const rows = await ctx.prisma.project.findMany({
          where: { organizationId, id: { in: accessible } },
          orderBy: { createdAt: "asc" },
        })
        const permissions = await loadProjectPermissions(ctx.subject, rows.map((row) => row.id))
        return rows.map((row) => toProjectShape(row, permissions.get(row.id)!))
      },
    }),

    project: t.field({
      type: ProjectRef,
      nullable: true,
      args: { id: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("project.view", String(args.id)),
      resolve: async (_parent, args, ctx) => {
        const row = await ctx.prisma.project.findUnique({ where: { id: String(args.id) } })
        if (!row) return null
        const permissions = await loadProjectPermissions(ctx.subject, [row.id])
        return toProjectShape(row, permissions.get(row.id)!)
      },
    }),

    documents: t.field({
      type: [DocumentRef],
      args: { organizationId: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.view", String(args.organizationId)),
      resolve: async (_parent, args, ctx) => {
        const organizationId = String(args.organizationId)
        const projectIds = await accessibleIds(ctx.subject, "project.view")
        const orgProjects = await ctx.prisma.project.findMany({
          where: { organizationId, id: { in: projectIds } },
          select: { id: true },
        })
        const documentIds = await accessibleIds(ctx.subject, "document.view")
        const rows = await ctx.prisma.document.findMany({
          where: { projectId: { in: orgProjects.map((p) => p.id) }, id: { in: documentIds } },
          orderBy: { createdAt: "asc" },
        })
        const permissions = await loadDocumentPermissions(ctx.subject, rows.map((row) => row.id))
        return rows.map((row) => toDocumentShape(row, permissions.get(row.id)!))
      },
    }),

    teams: t.field({
      type: [TeamRef],
      args: { organizationId: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.view_teams", String(args.organizationId)),
      resolve: (_parent, args, ctx) =>
        ctx.prisma.team.findMany({
          where: { organizationId: String(args.organizationId) },
          orderBy: { name: "asc" },
        }),
    }),

    members: t.field({
      type: [MembershipRef],
      args: { organizationId: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.view_members", String(args.organizationId)),
      resolve: async (_parent, args, ctx) => {
        const rows = await ctx.prisma.membership.findMany({
          where: { organizationId: String(args.organizationId) },
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

    accessRequests: t.field({
      type: [AccessRequestRef],
      args: { organizationId: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.view_members", String(args.organizationId)),
      resolve: (parent, args, ctx) =>
        ctx.prisma.accessRequest
          .findMany({
            where: { organizationId: String(args.organizationId) },
            include: { user: true },
            orderBy: { createdAt: "desc" },
          })
          .then((rows) => rows.map((row) => toAccessRequestShape(row))),
    }),

    auditLogs: t.field({
      type: [AuditLogRef],
      args: { organizationId: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.view_audit_logs", String(args.organizationId)),
      resolve: (parent, args, ctx) =>
        ctx.prisma.auditLog
          .findMany({
            where: { organizationId: String(args.organizationId) },
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

    dashboard: t.field({
      type: DashboardRef,
      args: { organizationId: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.view", String(args.organizationId)),
      resolve: async (_parent, args, ctx) => {
        const organizationId = String(args.organizationId)
        const permissions = await loadOrganizationPermissions(ctx.subject, organizationId)

        const projectIds = await accessibleIds(ctx.subject, "project.view")
        const orgProjects = await ctx.prisma.project.findMany({
          where: { organizationId, id: { in: projectIds } },
          select: { id: true },
        })
        const documentIds = await accessibleIds(ctx.subject, "document.view")
        const visibleDocuments = await ctx.prisma.document.count({
          where: { projectId: { in: orgProjects.map((p) => p.id) }, id: { in: documentIds } },
        })

        const org = await ctx.prisma.organization.findUnique({ where: { id: organizationId } })

        return {
          visibleProjects: orgProjects.length,
          visibleDocuments,
          // Sensitive metrics are null unless the viewer is authorized.
          members: permissions.canViewMembers
            ? await ctx.prisma.membership.count({ where: { organizationId } })
            : null,
          auditEvents: permissions.canViewAuditLogs
            ? await ctx.prisma.auditLog.count({ where: { organizationId } })
            : null,
          monthlyRevenue: permissions.canManageBilling ? (org?.monthlyRevenue ?? 0) : null,
        }
      },
    }),
  }),
})

function toAccessRequestShape(row: {
  id: string
  resourceType: string
  resourceId: string
  requestedRelation: string
  message: string | null
  status: string
  createdAt: Date
  user: { id: string; name: string; email: string; image: string | null }
}): AccessRequestShape {
  return {
    id: row.id,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    requestedRelation: row.requestedRelation,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt,
    user: row.user,
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

builder.mutationType({
  fields: (t) => ({
    createProject: t.field({
      type: ProjectRef,
      args: {
        organizationId: t.arg.id({ required: true }),
        input: t.arg({ type: ProjectInput, required: true }),
      },
      authScopes: (_parent, args) =>
        requirePerm("organization.create_project", String(args.organizationId)),
      resolve: async (_parent, args, ctx) => {
        const organizationId = String(args.organizationId)
        const project = await ctx.prisma.project.create({
          data: {
            organizationId,
            name: args.input.name,
            description: args.input.description ?? null,
            createdById: ctx.userId as string,
          },
        })
        await writeTuples(
          [
            {
              user: resourceObject("organization", organizationId),
              relation: "organization",
              object: resourceObject("project", project.id),
            },
            {
              user: userSubject(ctx.userId as string),
              relation: "owner",
              object: resourceObject("project", project.id),
            },
          ],
          true,
        )
        await logAudit(ctx, {
          organizationId,
          action: "project.created",
          resourceType: "project",
          resourceId: project.id,
          metadata: { name: project.name },
        })
        const permissions = await loadProjectPermissions(ctx.subject, [project.id])
        return toProjectShape(project, permissions.get(project.id)!)
      },
    }),

    updateProject: t.field({
      type: ProjectRef,
      args: { id: t.arg.id({ required: true }), input: t.arg({ type: ProjectInput, required: true }) },
      authScopes: (_parent, args) => requirePerm("project.update", String(args.id)),
      resolve: async (_parent, args, ctx) => {
        const project = await ctx.prisma.project.update({
          where: { id: String(args.id) },
          data: {
            name: args.input.name,
            description: args.input.description ?? null,
          },
        })
        await logAudit(ctx, {
          organizationId: project.organizationId,
          action: "project.updated",
          resourceType: "project",
          resourceId: project.id,
        })
        const permissions = await loadProjectPermissions(ctx.subject, [project.id])
        return toProjectShape(project, permissions.get(project.id)!)
      },
    }),

    deleteProject: t.field({
      type: "Boolean",
      args: { id: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("project.delete", String(args.id)),
      resolve: async (_parent, args, ctx) => {
        const id = String(args.id)
        const project = await ctx.prisma.project.findUnique({ where: { id }, include: { documents: true } })
        if (!project) forbid("Project not found")
        await ctx.prisma.project.delete({ where: { id } })
        await deleteTuplesForObject(resourceObject("project", id))
        for (const document of project.documents) {
          await deleteTuplesForObject(resourceObject("document", document.id))
        }
        await logAudit(ctx, {
          organizationId: project.organizationId,
          action: "project.deleted",
          resourceType: "project",
          resourceId: id,
          metadata: { name: project.name },
        })
        return true
      },
    }),

    createDocument: t.field({
      type: DocumentRef,
      args: { projectId: t.arg.id({ required: true }), input: t.arg({ type: DocumentInput, required: true }) },
      authScopes: (_parent, args) => requirePerm("project.create_document", String(args.projectId)),
      resolve: async (_parent, args, ctx) => {
        const projectId = String(args.projectId)
        const project = await ctx.prisma.project.findUnique({ where: { id: projectId } })
        if (!project) forbid("Project not found")
        const document = await ctx.prisma.document.create({
          data: {
            projectId,
            title: args.input.title,
            body: args.input.body ?? "",
            createdById: ctx.userId as string,
          },
        })
        await writeTuples(
          [
            {
              user: resourceObject("project", projectId),
              relation: "project",
              object: resourceObject("document", document.id),
            },
            {
              user: userSubject(ctx.userId as string),
              relation: "owner",
              object: resourceObject("document", document.id),
            },
          ],
          true,
        )
        await logAudit(ctx, {
          organizationId: project.organizationId,
          action: "document.created",
          resourceType: "document",
          resourceId: document.id,
          metadata: { title: document.title },
        })
        const permissions = await loadDocumentPermissions(ctx.subject, [document.id])
        return toDocumentShape(document, permissions.get(document.id)!)
      },
    }),

    updateDocument: t.field({
      type: DocumentRef,
      args: { id: t.arg.id({ required: true }), input: t.arg({ type: DocumentInput, required: true }) },
      authScopes: (_parent, args) => requirePerm("document.update", String(args.id)),
      resolve: async (_parent, args, ctx) => {
        const document = await ctx.prisma.document.update({
          where: { id: String(args.id) },
          data: { title: args.input.title, body: args.input.body ?? "" },
        })
        const project = await ctx.prisma.project.findUnique({ where: { id: document.projectId } })
        await logAudit(ctx, {
          organizationId: project?.organizationId ?? "",
          action: "document.updated",
          resourceType: "document",
          resourceId: document.id,
        })
        const permissions = await loadDocumentPermissions(ctx.subject, [document.id])
        return toDocumentShape(document, permissions.get(document.id)!)
      },
    }),

    deleteDocument: t.field({
      type: "Boolean",
      args: { id: t.arg.id({ required: true }) },
      authScopes: (_parent, args) => requirePerm("document.delete", String(args.id)),
      resolve: async (_parent, args, ctx) => {
        const id = String(args.id)
        const document = await ctx.prisma.document.findUnique({
          where: { id },
          include: { project: true },
        })
        if (!document) forbid("Document not found")
        await ctx.prisma.document.delete({ where: { id } })
        await deleteTuplesForObject(resourceObject("document", id))
        await logAudit(ctx, {
          organizationId: document.project.organizationId,
          action: "document.deleted",
          resourceType: "document",
          resourceId: id,
          metadata: { title: document.title },
        })
        return true
      },
    }),

    inviteMember: t.field({
      type: MembershipRef,
      args: {
        organizationId: t.arg.id({ required: true }),
        input: t.arg({ type: InviteMemberInput, required: true }),
      },
      authScopes: (_parent, args) =>
        requirePerm("organization.manage_members", String(args.organizationId)),
      resolve: async (_parent, args, ctx) => {
        const organizationId = String(args.organizationId)
        const email = args.input.email.toLowerCase()
        let user = await ctx.prisma.user.findUnique({ where: { email } })
        if (!user) {
          user = await ctx.prisma.user.create({
            data: {
              id: `user_${Math.random().toString(36).slice(2, 12)}`,
              name: args.input.name ?? email.split("@")[0]!,
              email,
              emailVerified: false,
            },
          })
        }
        const membership = await ctx.prisma.membership.upsert({
          where: { organizationId_userId: { organizationId, userId: user.id } },
          update: { role: args.input.role },
          create: { organizationId, userId: user.id, role: args.input.role },
        })
        await setMemberRole(user.id, organizationId, ROLE_TO_RELATION[args.input.role])
        await logAudit(ctx, {
          organizationId,
          action: "member.invited",
          resourceType: "user",
          resourceId: user.id,
          metadata: { role: args.input.role, email },
        })
        return {
          id: membership.id,
          role: membership.role,
          createdAt: membership.createdAt,
          user,
        }
      },
    }),

    changeMemberRole: t.field({
      type: MembershipRef,
      args: {
        organizationId: t.arg.id({ required: true }),
        userId: t.arg.id({ required: true }),
        role: t.arg({ type: OrgRoleEnum, required: true }),
      },
      authScopes: (_parent, args) =>
        requirePerm("organization.manage_members", String(args.organizationId)),
      resolve: async (_parent, args, ctx) => {
        const organizationId = String(args.organizationId)
        const userId = String(args.userId)
        const membership = await ctx.prisma.membership.update({
          where: { organizationId_userId: { organizationId, userId } },
          data: { role: args.role },
          include: { user: true },
        })
        await setMemberRole(userId, organizationId, ROLE_TO_RELATION[args.role])
        await logAudit(ctx, {
          organizationId,
          action: "member.role_changed",
          resourceType: "user",
          resourceId: userId,
          metadata: { role: args.role },
        })
        return {
          id: membership.id,
          role: membership.role,
          createdAt: membership.createdAt,
          user: membership.user,
        }
      },
    }),

    removeMember: t.field({
      type: "Boolean",
      args: { organizationId: t.arg.id({ required: true }), userId: t.arg.id({ required: true }) },
      authScopes: (_parent, args) =>
        requirePerm("organization.manage_members", String(args.organizationId)),
      resolve: async (_parent, args, ctx) => {
        const organizationId = String(args.organizationId)
        const userId = String(args.userId)
        await ctx.prisma.membership.delete({
          where: { organizationId_userId: { organizationId, userId } },
        })
        const object = resourceObject("organization", organizationId)
        const subject = userSubject(userId)
        const roles = ["owner", "admin", "member"] as const
        await deleteTuples(
          roles.map((relation) => ({ user: subject, relation, object })),
          true,
        )
        await logAudit(ctx, {
          organizationId,
          action: "member.removed",
          resourceType: "user",
          resourceId: userId,
        })
        return true
      },
    }),

    requestAccess: t.field({
      type: AccessRequestRef,
      args: { input: t.arg({ type: AccessRequestInput, required: true }) },
      authScopes: { loggedIn: true },
      resolve: async (_parent, args, ctx) => {
        const request = await ctx.prisma.accessRequest.create({
          data: {
            organizationId: String(args.input.organizationId),
            userId: ctx.userId as string,
            resourceType: args.input.resourceType,
            resourceId: String(args.input.resourceId),
            requestedRelation: args.input.requestedRelation,
            message: args.input.message ?? null,
          },
          include: { user: true },
        })
        await logAudit(ctx, {
          organizationId: String(args.input.organizationId),
          action: "access.requested",
          resourceType: args.input.resourceType,
          resourceId: String(args.input.resourceId),
          metadata: { relation: args.input.requestedRelation },
        })
        return toAccessRequestShape(request)
      },
    }),

    approveAccessRequest: t.field({
      type: AccessRequestRef,
      args: { id: t.arg.id({ required: true }) },
      authScopes: { loggedIn: true },
      resolve: async (_parent, args, ctx) => {
        const id = String(args.id)
        const request = await ctx.prisma.accessRequest.findUnique({ where: { id }, include: { user: true } })
        if (!request) forbid("Access request not found")
        // Org is derived from the row, so the permission check happens here.
        await requirePermission(ctx.subject as string, "organization.manage_members", request.organizationId)
        const tuple: FgaTuple = {
          user: userSubject(request.userId),
          relation: request.requestedRelation,
          object: resourceObject(
            request.resourceType as "project" | "document" | "team" | "organization",
            request.resourceId,
          ),
        }
        await writeTuples([tuple], true)
        const updated = await ctx.prisma.accessRequest.update({
          where: { id },
          data: { status: "APPROVED", decidedById: ctx.userId, decidedAt: new Date() },
          include: { user: true },
        })
        await logAudit(ctx, {
          organizationId: request.organizationId,
          action: "access.approved",
          resourceType: request.resourceType,
          resourceId: request.resourceId,
          metadata: { relation: request.requestedRelation, userId: request.userId },
        })
        return toAccessRequestShape(updated)
      },
    }),

    rejectAccessRequest: t.field({
      type: AccessRequestRef,
      args: { id: t.arg.id({ required: true }) },
      authScopes: { loggedIn: true },
      resolve: async (_parent, args, ctx) => {
        const id = String(args.id)
        const request = await ctx.prisma.accessRequest.findUnique({ where: { id }, include: { user: true } })
        if (!request) forbid("Access request not found")
        await requirePermission(ctx.subject as string, "organization.manage_members", request.organizationId)
        const updated = await ctx.prisma.accessRequest.update({
          where: { id },
          data: { status: "REJECTED", decidedById: ctx.userId, decidedAt: new Date() },
          include: { user: true },
        })
        await logAudit(ctx, {
          organizationId: request.organizationId,
          action: "access.rejected",
          resourceType: request.resourceType,
          resourceId: request.resourceId,
        })
        return toAccessRequestShape(updated)
      },
    }),

    updateOrganization: t.field({
      type: OrganizationRef,
      args: { id: t.arg.id({ required: true }), input: t.arg({ type: UpdateOrganizationInput, required: true }) },
      authScopes: (_parent, args) => requirePerm("organization.manage", String(args.id)),
      resolve: async (_parent, args, ctx) => {
        const id = String(args.id)
        const org = await ctx.prisma.organization.update({ where: { id }, data: { name: args.input.name } })
        await logAudit(ctx, {
          organizationId: id,
          action: "organization.updated",
          resourceType: "organization",
          resourceId: id,
          metadata: { name: org.name },
        })
        const permissions = await loadOrganizationPermissions(ctx.subject, id)
        return { ...org, permissions }
      },
    }),
  }),
})

export const schema = builder.toSchema()
