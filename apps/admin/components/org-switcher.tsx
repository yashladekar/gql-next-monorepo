"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Building2, Check, ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { ACTIVE_ORG_COOKIE } from "@/lib/constants"
import type { AdminOrganization } from "@/lib/admin-guard"

export function OrgSwitcher({
  organizations,
  activeOrgId,
}: {
  organizations: AdminOrganization[]
  activeOrgId: string
}) {
  const router = useRouter()
  const active = organizations.find((org) => org.id === activeOrgId)

  function switchOrganization(id: string) {
    document.cookie = `${ACTIVE_ORG_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="w-full justify-between data-[popup-open]:bg-muted" />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <Building2 className="size-4 shrink-0" />
          <span className="truncate text-sm font-medium">{active?.name ?? "Select organization"}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations you manage</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem key={org.id} onClick={() => switchOrganization(org.id)}>
              <span className="flex flex-1 items-center gap-2">
                <Building2 className="size-4" />
                <span className="truncate">{org.name}</span>
              </span>
              {org.id === activeOrgId ? <Check className="size-4" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
