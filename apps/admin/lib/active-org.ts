import { cookies } from "next/headers"
import { ACTIVE_ORG_COOKIE, ACTIVE_STORE_COOKIE } from "./constants"

// The active organization / OpenFGA store are stored in cookies so the server can
// pick them up on render (no flicker on switch).
export async function readActiveOrgCookie(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACTIVE_ORG_COOKIE)?.value ?? null
}

export async function readActiveStoreCookie(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACTIVE_STORE_COOKIE)?.value ?? null
}
