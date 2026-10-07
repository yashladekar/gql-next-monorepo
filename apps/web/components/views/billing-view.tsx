"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/page-header"
import { usePermissions } from "@/hooks/use-permissions"
import { gql } from "@/lib/graphql-client"

type Billing = {
  id: string
  name: string
  plan: string
  billingEmail: string | null
  monthlyRevenue: number
}

const BILLING_QUERY = /* GraphQL */ `
  query Billing($id: ID!) {
    organization(id: $id) {
      id
      name
      plan
      billingEmail
      monthlyRevenue
    }
  }
`

export function BillingView() {
  const { organizationId } = usePermissions()
  const { data, isPending } = useQuery({
    queryKey: ["billing", organizationId],
    queryFn: () =>
      gql<{ organization: Billing }>(BILLING_QUERY, { id: organizationId }).then(
        (result) => result.organization,
      ),
  })

  return (
    <>
      <PageHeader
        title="Billing"
        description="Billing fields are gated server-side by organization.manage_billing."
      />
      {isPending || !data ? (
        <Skeleton className="h-48 w-full max-w-xl" />
      ) : (
        <Card className="max-w-xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{data.name}</CardTitle>
            <Badge variant="secondary">{data.plan}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Billing email</span>
              <span className="font-medium">{data.billingEmail ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly revenue</span>
              <span className="font-medium tabular-nums">
                ₹{data.monthlyRevenue.toLocaleString("en-IN")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
