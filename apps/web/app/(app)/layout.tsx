import { userSubject } from "@workspace/authz"
import { prisma } from "@workspace/db"
import { AppShell } from "@/components/app-shell"
import { requireSession } from "@/lib/dal"
import { readActiveOrgCookie } from "@/lib/active-org"
import { accessibleIds, loadOrganizationPermissions } from "@/lib/graphql/projections"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const subject = userSubject(session.user.id)

  // Only organizations the user is a member of, decided by OpenFGA.
  const orgIds = await accessibleIds(subject, "organization.view")
  const organizations = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  })

  if (organizations.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-center text-sm text-muted-foreground">
        You are not a member of any organization yet.
      </div>
    )
  }

  const cookieOrg = await readActiveOrgCookie()
  const activeOrgId = organizations.find((org) => org.id === cookieOrg)?.id ?? organizations[0]!.id

  // Capability projection for navigation and page gates — resolved once per request.
  const permissions = await loadOrganizationPermissions(subject, activeOrgId)

  return (
    <AppShell
      user={{ name: session.user.name }}
      organizations={organizations}
      activeOrgId={activeOrgId}
      permissions={permissions}
    >
      {children}
    </AppShell>
  )
}
