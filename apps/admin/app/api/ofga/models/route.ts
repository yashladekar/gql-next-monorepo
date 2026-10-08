import {
  listModelsAdmin,
  writeModelAdmin,
  writeModelFromDslAdmin,
  type ModelJson,
} from "@workspace/authz"
import { NextResponse } from "next/server"
import { asString, errorResponse, guard, readJson, resolveStoreId } from "@/lib/ofga-api"

export async function GET(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const url = new URL(request.url)
    const storeId = await resolveStoreId(url.searchParams.get("storeId"))
    return NextResponse.json({ models: await listModelsAdmin(storeId) })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const body = await readJson(request)
    const storeId = await resolveStoreId(asString(body.storeId))
    const dsl = asString(body.dsl)
    const json = body.json as ModelJson | undefined
    const modelId = dsl
      ? await writeModelFromDslAdmin(storeId, dsl)
      : json
        ? await writeModelAdmin(storeId, json)
        : null
    if (!modelId) {
      return NextResponse.json({ error: "Provide a DSL string or a JSON model" }, { status: 400 })
    }
    return NextResponse.json({ modelId })
  } catch (error) {
    return errorResponse(error)
  }
}
