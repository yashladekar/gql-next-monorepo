import { describe, expect, it } from "vitest"
import { DEMO_IDS } from "../demo-ids"
import { PERMISSIONS, relationFor, type Permission } from "../permissions"
import { check, listAccessibleIds, projectPermissions } from "../service"

const { users, orgs, projects, documents } = DEMO_IDS
const u = (id: string) => `user:${id}`

// These run against a real OpenFGA only when it is configured; otherwise skipped.
// The store/model ids are resolved automatically by the client, so a reachable
// API URL is enough.
const fgaConfigured = Boolean(process.env.OPENFGA_API_URL)
const describeFga = fgaConfigured ? describe : describe.skip

describe("permission catalog", () => {
  it("maps every permission to a resource + relation", () => {
    for (const [key, spec] of Object.entries(PERMISSIONS)) {
      expect(spec.resource, `${key} resource`).toBeTruthy()
      expect(spec.relation, `${key} relation`).toBeTruthy()
      expect(relationFor(key as Permission)).toBe(spec.relation)
    }
  })
})

describeFga("OpenFGA authorization matrix", () => {
  it("owner can manage billing; admin cannot", async () => {
    expect(await check(u(users.alice), "organization.manage_billing", orgs.acme)).toBe(true)
    expect(await check(u(users.bob), "organization.manage_billing", orgs.acme)).toBe(false)
    expect(await check(u(users.bob), "organization.manage_members", orgs.acme)).toBe(true)
    expect(await check(u(users.bob), "organization.view_audit_logs", orgs.acme)).toBe(true)
    expect(await check(u(users.david), "organization.manage_members", orgs.acme)).toBe(false)
  })

  it("members list is admin/owner only; teams are visible to every member", async () => {
    expect(await check(u(users.alice), "organization.view_members", orgs.acme)).toBe(true)
    expect(await check(u(users.bob), "organization.view_members", orgs.acme)).toBe(true)
    expect(await check(u(users.charlie), "organization.view_members", orgs.acme)).toBe(false)
    expect(await check(u(users.david), "organization.view_members", orgs.acme)).toBe(false)

    expect(await check(u(users.charlie), "organization.view_teams", orgs.acme)).toBe(true)
    expect(await check(u(users.david), "organization.view_teams", orgs.acme)).toBe(true)
    expect(await check(u(users.charlie), "organization.view", orgs.acme)).toBe(true)
    expect(await check(u(users.david), "organization.view", orgs.acme)).toBe(true)
  })

  it("editor (charlie) can edit Alpha but not delete it, and cannot see Beta", async () => {
    expect(await check(u(users.charlie), "project.view", projects.alpha)).toBe(true)
    expect(await check(u(users.charlie), "project.update", projects.alpha)).toBe(true)
    expect(await check(u(users.charlie), "project.share", projects.alpha)).toBe(true)
    expect(await check(u(users.charlie), "project.delete", projects.alpha)).toBe(false)
    expect(await check(u(users.charlie), "project.view", projects.beta)).toBe(false)
    expect(await check(u(users.charlie), "document.view", documents.roadmap)).toBe(true)
  })

  it("viewer (david) can only read Alpha", async () => {
    expect(await check(u(users.david), "project.view", projects.alpha)).toBe(true)
    expect(await check(u(users.david), "project.update", projects.alpha)).toBe(false)
    expect(await check(u(users.david), "project.delete", projects.alpha)).toBe(false)
    expect(await check(u(users.david), "project.create_document", projects.alpha)).toBe(false)
  })

  it("projects inherit org-level rights (admin edits all, only owner deletes all)", async () => {
    expect(await check(u(users.bob), "project.update", projects.gamma)).toBe(true)
    expect(await check(u(users.bob), "project.delete", projects.gamma)).toBe(false)
    expect(await check(u(users.alice), "project.delete", projects.gamma)).toBe(true)
  })

  it("IDOR: a user cannot reach another tenant's project by id", async () => {
    expect(await check(u(users.david), "project.view", projects.globexWeb)).toBe(false)
    expect(await check(u(users.charlie), "project.view", projects.globexWeb)).toBe(false)
  })

  it("row-level listObjects returns only authorized project ids", async () => {
    const ids = await listAccessibleIds(u(users.charlie), "project.view")
    expect(ids).toContain(projects.alpha)
    expect(ids).not.toContain(projects.beta)
    expect(ids).not.toContain(projects.gamma)
  })

  it("projectPermissions returns a complete permission set", async () => {
    const perms = await projectPermissions(u(users.charlie), "project", projects.alpha, [
      "project.view",
      "project.update",
      "project.delete",
      "project.share",
    ])
    expect(perms["project.view"]).toBe(true)
    expect(perms["project.update"]).toBe(true)
    expect(perms["project.delete"]).toBe(false)
    expect(perms["project.share"]).toBe(true)
  })
})
