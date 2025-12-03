import { NextResponse } from "next/server"
import { getAllBills } from "@/lib/db"

export async function GET() {
  try {
    const bills = await getAllBills()
    
    return NextResponse.json({
      success: true,
      data: bills
    })
  } catch (error) {
    console.error("Viewer bills error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch bills"
        }
      },
      { status: 500 }
    )
  }
}