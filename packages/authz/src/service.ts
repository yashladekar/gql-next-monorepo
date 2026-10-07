import {
  ClientWriteRequestOnDuplicateWrites,
  ClientWriteRequestOnMissingDeletes,
  ConsistencyPreference,
} from "@openfga/sdk"
import { getFgaClient } from "./client"
import { PERMISSIONS, relationFor, type Permission, type ResourceType } from "./permissions"

// Reads use higher consistency so the demo is deterministic: a tuple written by
// one request (e.g. approving an access request) is visible to the next read
// instead of lagging behind eventual consistency.
const CONSISTENCY = { consistency: ConsistencyPreference.HigherConsistency }

export type Subject = string
export type FgaTuple = { user: string; relation: string; object: string }

export function userSubject(userId: string): Subject {
  return `user:${userId}`
}

export function resourceObject(resource: ResourceType, id: string): string {
  return `${resource}:${id}`
}

export class ForbiddenError extends Error {
  readonly permission?: Permission
  constructor(message: string, permission?: Permission) {
    super(message)
    this.name = "ForbiddenError"
    this.permission = permission
  }
}

/**
 * AuthorizationService — the single choke point between the app and OpenFGA.
 * Every protected operation goes through here; the model is the only place
 * authorization rules live.
 */

/** Check a single permission for one resource. */
export async function check(
  subject: Subject,
  permission: Permission,
  resourceId: string,
): Promise<boolean> {
  const spec = PERMISSIONS[permission]
  const { allowed } = await (await getFgaClient()).check(
    {
      user: subject,
      relation: spec.relation,
      object: resourceObject(spec.resource, resourceId),
    },
    CONSISTENCY,
  )
  return allowed === true
}

/** Check an arbitrary relation/object pair (used for raw, low-level checks). */
export async function checkRelation(
  subject: Subject,
  relation: string,
  object: string,
): Promise<boolean> {
  const { allowed } = await (
    await getFgaClient()
  ).check({ user: subject, relation, object }, CONSISTENCY)
  return allowed === true
}

/** Throw ForbiddenError unless the subject holds `permission` on the resource. */
export async function requirePermission(
  subject: Subject,
  permission: Permission,
  resourceId: string,
): Promise<void> {
  if (!(await check(subject, permission, resourceId))) {
    throw new ForbiddenError(`Missing permission: ${permission}`, permission)
  }
}

/**
 * Permission projection for a single resource: one ListRelations call returns
 * every relation the subject holds, instead of N separate Check calls (avoids
 * N+1). This is the `permissions: { canRead, canUpdate, ... }` object the frontend
 * consumes.
 */
export async function projectPermissions(
  subject: Subject,
  resourceType: ResourceType,
  resourceId: string,
  permissions: readonly Permission[],
): Promise<Record<string, boolean>> {
  const object = resourceObject(resourceType, resourceId)
  const wanted = permissions.map((p) => relationFor(p))
  const { relations } = await (
    await getFgaClient()
  ).listRelations(
    {
      user: subject,
      object,
      relations: wanted,
    },
    CONSISTENCY,
  )
  const granted = new Set(relations ?? [])
  const projection: Record<string, boolean> = {}
  for (const permission of permissions) {
    projection[permission] = granted.has(relationFor(permission))
  }
  return projection
}

/**
 * List the ids of all resources of a type the subject can reach for a
 * permission. Resolve the returned ids with a single Prisma `WHERE id IN (...)`.
 * Unauthorized rows are never fetched — the UI cannot receive them.
 */
export async function listAccessibleIds(
  subject: Subject,
  permission: Permission,
): Promise<string[]> {
  const spec = PERMISSIONS[permission]
  const { objects } = await (
    await getFgaClient()
  ).listObjects(
    {
      user: subject,
      relation: spec.relation,
      type: spec.resource,
    },
    CONSISTENCY,
  )
  return (objects ?? []).map((object) => object.slice(object.indexOf(":") + 1))
}

/**
 * BatchCheck — for many (resource, permission) pairs across different objects
 * in a single round trip. Use this for tables; use ListRelations for one object.
 */
export async function batchCheck(
  subject: Subject,
  checks: { permission: Permission; resourceId: string }[],
): Promise<boolean[]> {
  if (checks.length === 0) return []
  const { result } = await (await getFgaClient()).batchCheck({
    checks: checks.map((entry, index) => ({
      user: subject,
      relation: relationFor(entry.permission),
      object: resourceObject(PERMISSIONS[entry.permission].resource, entry.resourceId),
      correlationId: String(index),
      consistency: ConsistencyPreference.HigherConsistency,
    })),
  })
  const allowedById = new Map(
    (result ?? []).map((r) => [r.correlationId, r.allowed === true] as const),
  )
  return checks.map((_, index) => allowedById.get(String(index)) ?? false)
}

/** Write tuples. `idempotent` makes duplicate writes a no-op (safe re-seed). */
export async function writeTuples(tuples: FgaTuple[], idempotent = false): Promise<void> {
  if (tuples.length === 0) return
  await (await getFgaClient()).writeTuples(
    tuples,
    idempotent
      ? { conflict: { onDuplicateWrites: ClientWriteRequestOnDuplicateWrites.Ignore } }
      : undefined,
  )
}

/** Delete tuples. `idempotent` makes missing deletes a no-op (safe re-seed). */
export async function deleteTuples(tuples: FgaTuple[], idempotent = false): Promise<void> {
  if (tuples.length === 0) return
  await (await getFgaClient()).deleteTuples(
    tuples,
    idempotent
      ? { conflict: { onMissingDeletes: ClientWriteRequestOnMissingDeletes.Ignore } }
      : undefined,
  )
}

/** Read the raw tuples attached to a single object. */
export async function readTuples(object: string): Promise<FgaTuple[]> {
  const { tuples } = await (await getFgaClient()).read({ object })
  return (tuples ?? []).map((tuple) => ({
    user: tuple.key.user,
    relation: tuple.key.relation,
    object: tuple.key.object,
  }))
}

/** Remove every relationship on an object (used when the resource is deleted). */
export async function deleteTuplesForObject(object: string): Promise<void> {
  const tuples = await readTuples(object)
  await deleteTuples(tuples, true)
}

/**
 * Move a user between org-level roles: delete the roles they no longer hold and
 * write the new one. Authorization is decided by these tuples, never by a column.
 */
export async function setMemberRole(
  userId: string,
  organizationId: string,
  role: "owner" | "admin" | "member",
): Promise<void> {
  const subject = userSubject(userId)
  const object = `organization:${organizationId}`
  const all: ("owner" | "admin" | "member")[] = ["owner", "admin", "member"]
  const toDelete = all
    .filter((candidate) => candidate !== role)
    .map((candidate) => ({ user: subject, relation: candidate, object }))
  await deleteTuples(toDelete, true)
  await writeTuples([{ user: subject, relation: role, object }], true)
}
