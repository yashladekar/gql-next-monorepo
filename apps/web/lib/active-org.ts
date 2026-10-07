import { cookies } from "next/headers"
import { ACTIVE_ORG_COOKIE } from "./constants"

// The active organization is stored in a cookie so the server can pick it up on
// render (no permission flicker on org switch).
export { ACTIVE_ORG_COOKIE }

export async function readActiveOrgCookie(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACTIVE_ORG_COOKIE)?.value ?? null
}
