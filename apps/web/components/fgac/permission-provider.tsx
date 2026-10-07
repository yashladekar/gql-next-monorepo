"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { OrganizationPermissions } from "@/lib/graphql/projections"

export type PermissionContextValue = {
  organizationId: string
  permissions: OrganizationPermissions
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

export function PermissionProvider({
  organizationId,
  permissions,
  children,
}: PermissionContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ organizationId, permissions }),
    [organizationId, permissions],
  )
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error("usePermissionContext must be used inside <PermissionProvider>")
  }
  return context
}
