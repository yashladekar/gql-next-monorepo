"use client"

import { Separator } from "@workspace/ui/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import {
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldQuestion,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { OrgSwitcher } from "@/components/org-switcher"
import { UserMenu } from "@/components/user-menu"
import { PermissionProvider } from "@/components/fgac/permission-provider"
import type { OrganizationSummary } from "@/hooks/use-organizations"
import type { OrganizationPermissions } from "@/lib/graphql/projections"
import { visibleNavItems } from "@/lib/nav"

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  UserCog,
  ShieldQuestion,
  Settings,
  CreditCard,
  ScrollText,
}

function AppSidebar({
  organizations,
  activeOrgId,
  permissions,
}: {
  organizations: OrganizationSummary[]
  activeOrgId: string
  permissions: OrganizationPermissions
}) {
  const pathname = usePathname()
  // Navigation is projected from capabilities — never from a role.
  const visibleItems = visibleNavItems(permissions)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = ICONS[item.icon] ?? LayoutDashboard
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppShell({
  user,
  organizations,
  activeOrgId,
  permissions,
  children,
}: {
  user: { name: string }
  organizations: OrganizationSummary[]
  activeOrgId: string
  permissions: OrganizationPermissions
  children: React.ReactNode
}) {
  const activeOrg = organizations.find((org) => org.id === activeOrgId)

  return (
    <PermissionProvider organizationId={activeOrgId} permissions={permissions}>
      <SidebarProvider>
        <AppSidebar
          organizations={organizations}
          activeOrgId={activeOrgId}
          permissions={permissions}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium">{activeOrg?.name}</span>
            <span className="ml-auto text-sm text-muted-foreground">{user.name}</span>
          </header>
          <main className="flex-1 overflow-x-hidden p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </PermissionProvider>
  )
}
