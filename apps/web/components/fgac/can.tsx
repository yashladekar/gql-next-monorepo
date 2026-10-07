"use client"

import type { Permission } from "@workspace/authz"
import type { ReactNode } from "react"
import { useCan } from "@/hooks/use-can"

type CanProps = {
  permission: Permission
  /** Optional resource permission projection (e.g. `project.permissions`). */
  on?: Record<string, boolean>
  children: ReactNode
  fallback?: ReactNode
}

/**
 * The single authorization-aware component used everywhere in the UI.
 * It never decides access by role — only by the permission it is given.
 */
export function Can({ permission, on, children, fallback = null }: CanProps) {
  const allowed = useCan(permission, on)
  return <>{allowed ? children : fallback}</>
}
