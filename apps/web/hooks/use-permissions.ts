"use client"

import { usePermissionContext } from "@/components/fgac/permission-provider"

/**
 * Organization-level capabilities for the active organization, supplied by the
 * server (no loading flicker). Prefer `<Can permission="...">` for component
 * gates; use this hook for logic that is not a simple render gate.
 */
export function usePermissions() {
  const { permissions, organizationId } = usePermissionContext()
  return { ...permissions, organizationId }
}
