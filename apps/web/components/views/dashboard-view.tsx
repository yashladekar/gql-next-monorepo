"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useDashboard } from "@/hooks/use-dashboard"
import { usePermissions } from "@/hooks/use-permissions"
import { PageHeader } from "@/components/page-header"

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardView() {
  const { organizationId } = usePermissions()
  const { data, isPending } = useDashboard(organizationId)

  if (isPending || !data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Metrics are projected server-side — you only receive what you are authorized to see."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="My Projects" value={String(data.visibleProjects)} />
        <Metric label="Documents" value={String(data.visibleDocuments)} />
        {/* Members count only exists for viewers with organization.view_members. */}
        {data.members !== null ? <Metric label="Members" value={String(data.members)} /> : null}
        {/* Revenue only exists for viewers with organization.manage_billing. */}
        {data.monthlyRevenue !== null ? (
          <Metric label="Monthly Revenue" value={`₹${data.monthlyRevenue.toLocaleString("en-IN")}`} />
        ) : null}
        {data.auditEvents !== null ? (
          <Metric label="Audit Events" value={String(data.auditEvents)} />
        ) : null}
      </div>
    </>
  )
}
