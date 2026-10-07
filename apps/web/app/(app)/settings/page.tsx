import { SettingsView } from "@/components/views/settings-view"
import { requireCapability } from "@/lib/server-permissions"

export default async function SettingsPage() {
  await requireCapability("canManage")
  return <SettingsView />
}
