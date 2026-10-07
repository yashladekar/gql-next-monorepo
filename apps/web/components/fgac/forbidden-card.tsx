"use client"

import { Button } from "@workspace/ui/components/button"
import { LockKeyholeIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export function ForbiddenCard({
  title = "You don't have permission to access this resource",
  description = "You can request access from an organization administrator.",
}: {
  title?: string
  description?: string
}) {
  const router = useRouter()
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <LockKeyholeIcon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" onClick={() => router.back()}>
        Go Back
      </Button>
    </div>
  )
}
