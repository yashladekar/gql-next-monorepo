import { ProjectsView } from "@/components/views/projects-view"
import { requireCapability } from "@/lib/server-permissions"

export default async function ProjectsPage() {
  await requireCapability("canView")
  return <ProjectsView />
}
