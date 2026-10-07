"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { UsersIcon } from "lucide-react"
import { EmptyState, LoadingRows } from "@/components/data-state"
import { PageHeader } from "@/components/page-header"
import { usePermissions } from "@/hooks/use-permissions"
import { useTeams } from "@/hooks/use-teams"

export function TeamsView() {
  const { organizationId } = usePermissions()
  const { data: teams, isPending } = useTeams(organizationId)

  return (
    <>
      <PageHeader title="Teams" description="Teams can be granted project roles in OpenFGA." />
      {isPending || !teams ? (
        <LoadingRows rows={2} />
      ) : teams.length === 0 ? (
        <EmptyState>No teams in this organization.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UsersIcon className="size-4" />
                  {team.name}
                </CardTitle>
                <Badge variant="outline">Team</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Project roles such as <code>editor</code> can target{" "}
                  <code>team:{team.name.toLowerCase()}#member</code>.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
