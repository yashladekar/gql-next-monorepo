"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { EmptyState, LoadingRows } from "@/components/data-state"
import { PageHeader } from "@/components/page-header"
import { useAuditLogs } from "@/hooks/use-audit-logs"
import { usePermissions } from "@/hooks/use-permissions"

export function AuditLogsView() {
  const { organizationId } = usePermissions()
  const { data: logs, isPending } = useAuditLogs(organizationId)

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Visible only to users with organization.view_audit_logs."
      />
      {isPending || !logs ? (
        <LoadingRows rows={4} />
      ) : logs.length === 0 ? (
        <EmptyState>No audit events recorded yet.</EmptyState>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell className="text-sm">
                    {log.resourceType}
                    {log.resourceId ? ` · ${log.resourceId}` : ""}
                  </TableCell>
                  <TableCell className="text-sm">{log.actor.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
