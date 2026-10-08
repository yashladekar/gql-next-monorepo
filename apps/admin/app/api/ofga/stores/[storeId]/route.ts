import { deleteStoreAdmin } from "@workspace/authz"
import { NextResponse } from "next/server"
import { errorResponse, guard } from "@/lib/ofga-api"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const denied = await guard()
  if (denied) return denied
  try {
    const { storeId } = await params
    await deleteStoreAdmin(storeId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
