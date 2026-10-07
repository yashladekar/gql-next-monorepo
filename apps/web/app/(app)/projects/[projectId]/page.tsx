import { check } from "@workspace/authz"
import { forbidden } from "next/navigation"
import { ProjectDetailView } from "@/components/views/project-detail-view"
import { getActiveOrgContext } from "@/lib/server-permissions"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { subject } = await getActiveOrgContext()

  // Route-level IDOR guard: a viewer cannot reach a project they have no
  // relationship with, even by typing the URL.
  if (!(await check(subject, "project.view", projectId))) forbidden()

  return <ProjectDetailView projectId={projectId} />
}
