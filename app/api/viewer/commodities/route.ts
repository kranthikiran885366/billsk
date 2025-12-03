import { NextResponse } from "next/server"
import { getAllCommodities } from "@/lib/db"

export async function GET() {
  try {
    const commodities = await getAllCommodities()
    
    return NextResponse.json({
      success: true,
      data: commodities
    })
  } catch (error) {
    console.error("Viewer commodities error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch commodities"
        }
      },
      { status: 500 }
    )
  }
}