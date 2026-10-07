import { DocumentsView } from "@/components/views/documents-view"
import { requireCapability } from "@/lib/server-permissions"

export default async function DocumentsPage() {
  await requireCapability("canView")
  return <DocumentsView />
}
