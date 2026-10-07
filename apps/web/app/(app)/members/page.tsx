import { MembersView } from "@/components/views/members-view"
import { requireCapability } from "@/lib/server-permissions"

export default async function MembersPage() {
  await requireCapability("canViewMembers")
  return <MembersView />
}
