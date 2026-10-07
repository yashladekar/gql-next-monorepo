import { userSubject } from "@workspace/authz"
import { prisma } from "@workspace/db"
import { forbidden, redirect } from "next/navigation"
import { cache } from "react"
import { readActiveOrgCookie } from "./active-org"
import { requireSession } from "./dal"
import {
  accessibleIds,
  loadOrganizationPermissions,
  type OrganizationPermissions,
} from "./graphql/projections"

/** Active organization + capability projection for the current request. */
export const getActiveOrgContext = cache(async () => {
  const session = await requireSession()
  const subject = userSubject(session.user.id)

  const orgIds = await accessibleIds(subject, "organization.view")
  const organizations = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  })
  if (organizations.length === 0) redirect("/sign-in")

  const cookieOrg = await readActiveOrgCookie()
  const activeOrgId = organizations.find((org) => org.id === cookieOrg)?.id ?? organizations[0]!.id
  const permissions = await loadOrganizationPermissions(subject, activeOrgId)

  return { session, subject, organizations, activeOrgId, permissions }
})

/**
 * Route-level gate. Called from a server page; if the capability is missing the
 * Next.js `forbidden` boundary renders the 403 page. Hiding the nav item is NOT
 * enough — this runs even when the URL is typed directly.
 */
export async function requireCapability(
  capability: keyof OrganizationPermissions,
): Promise<Awaited<ReturnType<typeof getActiveOrgContext>>> {
  const context = await getActiveOrgContext()
  if (!context.permissions[capability]) forbidden()
  return context
}
