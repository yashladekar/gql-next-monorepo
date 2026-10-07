"use client"

import { useQuery } from "@tanstack/react-query"
import { gql } from "@/lib/graphql-client"

export type Dashboard = {
  visibleProjects: number
  visibleDocuments: number
  members: number | null
  auditEvents: number | null
  monthlyRevenue: number | null
}

const DASHBOARD_QUERY = /* GraphQL */ `
  query Dashboard($organizationId: ID!) {
    dashboard(organizationId: $organizationId) {
      visibleProjects
      visibleDocuments
      members
      auditEvents
      monthlyRevenue
    }
  }
`

export function useDashboard(organizationId: string | null, initialData?: Dashboard) {
  return useQuery({
    queryKey: ["dashboard", organizationId],
    queryFn: () =>
      gql<{ dashboard: Dashboard }>(DASHBOARD_QUERY, { organizationId }).then(
        (data) => data.dashboard,
      ),
    enabled: !!organizationId,
    initialData,
  })
}
