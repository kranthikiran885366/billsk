import { NextRequest, NextResponse } from "next/server"
import { getAllBills } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params
    const farmerName = decodeURIComponent(name)
    const bills = await getAllBills()
    
    // Filter bills for this specific farmer
    const farmerBills = bills.filter(bill => bill.sellerName === farmerName)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({
      success: true,
      data: farmerBills
    })
  } catch (error) {
    console.error("Viewer farmer bills error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch farmer bills"
        }
      },
      { status: 500 }
    )
  }
}