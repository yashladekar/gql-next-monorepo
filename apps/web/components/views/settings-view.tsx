"use client"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { useOrganization, useUpdateOrganization } from "@/hooks/use-organization"
import { usePermissions } from "@/hooks/use-permissions"
import { graphqlErrorMessage } from "@/lib/graphql-client"

export function SettingsView() {
  const { organizationId } = usePermissions()
  const { data: organization } = useOrganization(organizationId)
  const updateOrganization = useUpdateOrganization(organizationId)
  const router = useRouter()
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const value = name ?? organization?.name ?? ""

  return (
    <>
      <PageHeader
        title="Organization Settings"
        description="Visible only to users with organization.manage."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setError(null)
              setSaved(false)
              try {
                await updateOrganization.mutateAsync(value)
                setSaved(true)
                // The org name also appears in the server-rendered shell (sidebar header).
                router.refresh()
              } catch (mutationError) {
                setError(graphqlErrorMessage(mutationError))
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={value}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
            <div>
              <Button type="submit" disabled={updateOrganization.isPending}>
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
