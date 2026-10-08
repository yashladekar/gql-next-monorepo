import { validateDslAdmin } from "@workspace/authz"
import { NextResponse } from "next/server"
import { errorResponse, guard, readJson } from "@/lib/ofga-api"

export async function POST(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const body = await readJson(request)
    const dsl = typeof body.dsl === "string" ? body.dsl : ""
    return NextResponse.json(await validateDslAdmin(dsl))
  } catch (error) {
    return errorResponse(error)
  }
}
