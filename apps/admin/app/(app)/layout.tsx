import { AdminShell } from "@/components/admin-shell"
import { StoreProvider } from "@/components/store-provider"
import { readActiveStoreCookie } from "@/lib/active-org"
import { requireAdminContext } from "@/lib/admin-guard"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Authorization boundary for every admin page: session + organization.manage.
  const context = await requireAdminContext()
  const activeStoreId = (await readActiveStoreCookie()) ?? process.env.FGA_STORE_ID ?? ""

  return (
    <StoreProvider initialStoreId={activeStoreId}>
      <AdminShell
        user={{ name: context.userName }}
        organizations={context.organizations}
        activeOrgId={context.activeOrgId}
      >
        {children}
      </AdminShell>
    </StoreProvider>
  )
}
