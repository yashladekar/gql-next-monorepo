"use client"

import type { Permission } from "@workspace/authz"
import { useMemo } from "react"
import { usePermissions } from "@/hooks/use-permissions"
import { ORG_PERMISSION_KEY, resolveOnProjection } from "@/lib/permissions-map"

/**
 * Evaluate a permission for the UI.
 *  - No `on`  -> organization-level capability (from the server-provided context).
 *  - `on`     -> a resource permission projection returned by the API
 *                (e.g. `project.permissions`). No extra request is made.
 */
export function useCan(permission: Permission, on?: Record<string, boolean>): boolean {
  const orgPermissions = usePermissions()
  return useMemo(() => {
    if (on) return resolveOnProjection(permission, on)
    const key = ORG_PERMISSION_KEY[permission]
    return key ? orgPermissions[key] === true : false
  }, [permission, on, orgPermissions])
}
