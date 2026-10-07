import { describe, expect, it } from "vitest"
import type { OrganizationPermissions } from "@/lib/graphql/projections"
import { visibleNavItems } from "@/lib/nav"
import { resolveOnProjection } from "@/lib/permissions-map"

const base: OrganizationPermissions = {
  canView: true,
  canManage: false,
  canViewMembers: false,
  canViewTeams: true,
  canManageMembers: false,
  canManageTeams: false,
  canManageBilling: false,
  canViewAuditLogs: false,
  canCreateProject: false,
}

// Personas, built from the capability projection OpenFGA returns for each seed user.
const OWNER: OrganizationPermissions = {
  ...base,
  canManage: true,
  canViewMembers: true,
  canManageMembers: true,
  canManageTeams: true,
  canManageBilling: true,
  canViewAuditLogs: true,
  canCreateProject: true,
}
const ADMIN: OrganizationPermissions = {
  ...base,
  canManage: true,
  canViewMembers: true,
  canManageMembers: true,
  canManageTeams: true,
  canViewAuditLogs: true,
  canCreateProject: true,
}
const EDITOR: OrganizationPermissions = { ...base }
const VIEWER: OrganizationPermissions = { ...base }

describe("resolveOnProjection", () => {
  const projectPermissions = {
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canShare: true,
    canCreateDocument: true,
    canManage: false,
  }

  it("resolves project permissions from a resource projection", () => {
    expect(resolveOnProjection("project.view", projectPermissions)).toBe(true)
    expect(resolveOnProjection("project.update", projectPermissions)).toBe(true)
    expect(resolveOnProjection("project.delete", projectPermissions)).toBe(false)
    expect(resolveOnProjection("project.share", projectPermissions)).toBe(true)
  })

  it("resolves document permissions", () => {
    expect(resolveOnProjection("document.view", { canRead: true, canUpdate: false })).toBe(true)
    expect(resolveOnProjection("document.update", { canRead: true, canUpdate: false })).toBe(false)
  })

  it("resolves organization permissions", () => {
    expect(resolveOnProjection("organization.manage_billing", { canManageBilling: true })).toBe(true)
    expect(resolveOnProjection("organization.manage_billing", { canManageBilling: false })).toBe(false)
  })

  it("denies when the projection field is absent", () => {
    expect(resolveOnProjection("organization.manage_billing", {})).toBe(false)
  })
})

describe("visibleNavItems", () => {
  const keys = (permissions: OrganizationPermissions) =>
    visibleNavItems(permissions).map((item) => item.key)

  it("shows every item for an owner", () => {
    expect(keys(OWNER)).toEqual([
      "dashboard",
      "projects",
      "documents",
      "teams",
      "members",
      "access-requests",
      "settings",
      "billing",
      "audit-logs",
    ])
  })

  it("hides Billing for an admin", () => {
    const admin = keys(ADMIN)
    expect(admin).not.toContain("billing")
    expect(admin).toContain("members")
    expect(admin).toContain("audit-logs")
    expect(admin).toContain("settings")
  })

  it("shows only the four workspace items for an editor or viewer", () => {
    expect(keys(EDITOR)).toEqual(["dashboard", "projects", "documents", "teams"])
    expect(keys(VIEWER)).toEqual(["dashboard", "projects", "documents", "teams"])
  })

  it("never reveals admin-only items to a viewer", () => {
    const viewer = keys(VIEWER)
    expect(viewer).not.toContain("members")
    expect(viewer).not.toContain("settings")
    expect(viewer).not.toContain("billing")
    expect(viewer).not.toContain("audit-logs")
  })
})
