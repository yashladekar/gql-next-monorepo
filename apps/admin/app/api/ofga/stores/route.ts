import { createStoreAdmin, listStoresAdmin } from "@workspace/authz"
import { NextResponse } from "next/server"
import { errorResponse, guard, readJson } from "@/lib/ofga-api"

export async function GET() {
  const denied = await guard()
  if (denied) return denied
  try {
    return NextResponse.json({ stores: await listStoresAdmin() })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const body = await readJson(request)
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
    return NextResponse.json({ store: await createStoreAdmin(name) })
  } catch (error) {
    return errorResponse(error)
  }
}
