import { NextResponse } from "next/server"
import { getAdminContext } from "./admin-guard"
import { readActiveStoreCookie } from "./active-org"

// Shared helpers for the /api/ofga route handlers. Every handler must call
// `guard()` first — this is the authorization boundary, not the sidebar.

export async function guard(): Promise<NextResponse | null> {
  const context = await getAdminContext()
  if (!context) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

/** Explicit storeId, else the selected-store cookie, else FGA_STORE_ID. */
export async function resolveStoreId(explicit?: string | null): Promise<string> {
  if (explicit) return explicit
  const cookie = await readActiveStoreCookie()
  if (cookie) return cookie
  const env = process.env.FGA_STORE_ID
  if (!env) throw new Error("No OpenFGA store selected and FGA_STORE_ID is not set.")
  return env
}

export function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error)
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = (await request.json().catch(() => ({}))) as unknown
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {}
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}
