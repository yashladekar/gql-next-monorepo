import { prisma } from "@workspace/db"
import { batchCheck, listAccessibleIds, userSubject } from "@workspace/authz"
import { auth } from "@workspace/auth"
import { cookies, headers } from "next/headers"
import { forbidden, redirect } from "next/navigation"
import { cache } from "react"
import { ACTIVE_ORG_COOKIE } from "./constants"

// Gate for the OpenFGA admin surface. A user may administer OpenFGA only if
// OpenFGA itself says they can manage at least one organization
// (`organization.manage`). This is the authorization boundary — the sidebar is
// only a projection of it.

export type AdminOrganization = { id: string; name: string; slug: string }

export type AdminContext = {
  userId: string
  userName: string
  userEmail: string
  subject: string
  organizations: AdminOrganization[]
  activeOrgId: string
}

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

/**
 * Resolve the admin context, or null when the caller has no session or manages
 * no organization. Cached per render pass.
 */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const session = await getSession()
  if (!session) return null

  const subject = userSubject(session.user.id)
  const orgIds = await listAccessibleIds(subject, "organization.view")
  if (orgIds.length === 0) return null

  const managed = await batchCheck(
    subject,
    orgIds.map((id) => ({ permission: "organization.manage" as const, resourceId: id })),
  )
  const managedOrgIds = orgIds.filter((_, index) => managed[index] === true)
  if (managedOrgIds.length === 0) return null

  const organizations = await prisma.organization.findMany({
    where: { id: { in: managedOrgIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  })

  const cookieOrg = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value ?? null
  const activeOrgId =
    organizations.find((org) => org.id === cookieOrg)?.id ?? organizations[0]!.id

  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    subject,
    organizations,
    activeOrgId,
  }
})

/** Page guard: redirect to sign-in when anonymous, 403 when unauthorized. */
export async function requireAdminContext(): Promise<AdminContext> {
  const context = await getAdminContext()
  if (context) return context
  if (!(await getSession())) redirect("/sign-in")
  forbidden()
}
