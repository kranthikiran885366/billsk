import { NextRequest, NextResponse } from "next/server"
import { getBillById } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bill = await getBillById(params.id)
    
    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Bill not found"
          }
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: bill
    })
  } catch (error) {
    console.error("Viewer bill detail error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch bill"
        }
      },
      { status: 500 }
    )
  }
}