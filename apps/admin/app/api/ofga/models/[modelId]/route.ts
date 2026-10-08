import { modelToDslAdmin, readModelAdmin } from "@workspace/authz"
import { NextResponse } from "next/server"
import { errorResponse, guard, resolveStoreId } from "@/lib/ofga-api"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ modelId: string }> },
) {
  const denied = await guard()
  if (denied) return denied
  try {
    const { modelId } = await params
    const url = new URL(request.url)
    const storeId = await resolveStoreId(url.searchParams.get("storeId"))
    const model = await readModelAdmin(storeId, modelId)
    if (!model) return NextResponse.json({ error: "Model not found" }, { status: 404 })
    const dsl = await modelToDslAdmin(model).catch(() => "")
    return NextResponse.json({ model, dsl })
  } catch (error) {
    return errorResponse(error)
  }
}
