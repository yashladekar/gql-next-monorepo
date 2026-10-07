import { TeamsView } from "@/components/views/teams-view"
import { requireCapability } from "@/lib/server-permissions"

export default async function TeamsPage() {
  await requireCapability("canViewTeams")
  return <TeamsView />
}
