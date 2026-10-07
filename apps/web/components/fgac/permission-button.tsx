"use client"

import type { Permission } from "@workspace/authz"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import type { ComponentProps } from "react"
import { useCan } from "@/hooks/use-can"

type PermissionButtonProps = ComponentProps<typeof Button> & {
  permission: Permission
  /** Resource permission projection; omit for organization-level capabilities. */
  on?: Record<string, boolean>
  /** Shown in a tooltip when the action is disabled. */
  disabledReason?: string
}

/**
 * "Disable" pattern: instead of hiding an action, render it disabled with an
 * explanatory tooltip. Used where discoverability is valuable (e.g. deleting a
 * project you can only view). Sensitive/admin navigation uses the "hide" pattern.
 */
export function PermissionButton({
  permission,
  on,
  disabledReason = "You don't have permission to perform this action.",
  children,
  ...buttonProps
}: PermissionButtonProps) {
  const allowed = useCan(permission, on)

  if (allowed) {
    return <Button {...buttonProps}>{children}</Button>
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex" />}
        aria-disabled="true"
      >
        <Button {...buttonProps} disabled>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{disabledReason}</TooltipContent>
    </Tooltip>
  )
}
