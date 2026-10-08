"use client"

import { Button } from "@workspace/ui/components/button"
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
  Boxes,
  Database,
  History,
  LayoutDashboard,
  Link2,
  LogIn,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { OrgSwitcher } from "@/components/org-switcher"
import { StoreSwitcher } from "@/components/store-switcher"
import { UserMenu } from "@/components/user-menu"
import { ADMIN_NAV, STUDIO_HREF } from "@/lib/nav"
import type { AdminOrganization } from "@/lib/admin-guard"

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Database,
  ShieldCheck,
  Link2,
  Search,
  History,
  Boxes,
}

function AppSidebar({
  organizations,
  activeOrgId,
}: {
  organizations: AdminOrganization[]
  activeOrgId: string
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} />
        <StoreSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {ADMIN_NAV.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? Boxes
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`)
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
        ))}
        <SidebarGroup>
          <SidebarGroupLabel>Identity</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<a href={STUDIO_HREF} target="_blank" rel="noreferrer" />}
                  tooltip="Better Auth Studio"
                >
                  <LogIn />
                  <span>Better Auth Studio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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

export function AdminShell({
  user,
  organizations,
  activeOrgId,
  children,
}: {
  user: { name: string }
  organizations: AdminOrganization[]
  activeOrgId: string
  children: React.ReactNode
}) {
  const activeOrg = organizations.find((org) => org.id === activeOrgId)

  return (
    <SidebarProvider>
      <AppSidebar organizations={organizations} activeOrgId={activeOrgId} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">FGAC Admin</span>
          <span className="text-sm text-muted-foreground">· {activeOrg?.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={STUDIO_HREF} target="_blank" rel="noreferrer" />}
            >
              Open Studio
            </Button>
            <span className="text-sm text-muted-foreground">{user.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
