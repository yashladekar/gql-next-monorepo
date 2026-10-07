import { AccessRequestsView } from "@/components/views/access-requests-view"
import { requireCapability } from "@/lib/server-permissions"

export default async function AccessRequestsPage() {
  await requireCapability("canViewMembers")
  return <AccessRequestsView />
}
