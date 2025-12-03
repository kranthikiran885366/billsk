import { NextRequest, NextResponse } from "next/server"
import { getBagsByBillId } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bags = await getBagsByBillId(params.id)
    
    return NextResponse.json({
      success: true,
      data: bags
    })
  } catch (error) {
    console.error("Viewer bags error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch bags"
        }
      },
      { status: 500 }
    )
  }
}