"use client"

import { useQuery } from "@tanstack/react-query"
import { gql } from "@/lib/graphql-client"

export type AuditLogEntry = {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  metadata: unknown
  createdAt: string
  actor: { id: string; name: string; email: string; image: string | null }
}

const AUDIT_LOGS_QUERY = /* GraphQL */ `
  query AuditLogs($organizationId: ID!) {
    auditLogs(organizationId: $organizationId) {
      id
      action
      resourceType
      resourceId
      metadata
      createdAt
      actor {
        id
        name
        email
        image
      }
    }
  }
`

export function useAuditLogs(organizationId: string | null, initialData?: AuditLogEntry[]) {
  return useQuery({
    queryKey: ["audit-logs", organizationId],
    queryFn: () =>
      gql<{ auditLogs: AuditLogEntry[] }>(AUDIT_LOGS_QUERY, { organizationId }).then(
        (data) => data.auditLogs,
      ),
    enabled: !!organizationId,
    initialData,
  })
}
