import { readChangesAdmin } from "@workspace/authz"
import { NextResponse } from "next/server"
import { asString, errorResponse, guard, resolveStoreId } from "@/lib/ofga-api"

export async function GET(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const url = new URL(request.url)
    const storeId = await resolveStoreId(url.searchParams.get("storeId"))
    const page = await readChangesAdmin(storeId, {
      type: asString(url.searchParams.get("type")),
      continuationToken: asString(url.searchParams.get("continuationToken")),
    })
    return NextResponse.json(page)
  } catch (error) {
    return errorResponse(error)
  }
}
