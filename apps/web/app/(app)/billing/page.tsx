import { BillingView } from "@/components/views/billing-view"
import { requireCapability } from "@/lib/server-permissions"

export default async function BillingPage() {
  await requireCapability("canManageBilling")
  return <BillingView />
}
