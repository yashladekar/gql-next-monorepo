import { AuditLogsView } from "@/components/views/audit-logs-view"
import { requireCapability } from "@/lib/server-permissions"

export default async function AuditLogsPage() {
  await requireCapability("canViewAuditLogs")
  return <AuditLogsView />
}
