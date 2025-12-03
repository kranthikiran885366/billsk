import { NextResponse } from "next/server"
import { getAllBills } from "@/lib/db"

export async function GET() {
  try {
    const bills = await getAllBills()
    
    // Group bills by farmer (seller)
    const farmerMap = new Map()
    
    bills.forEach(bill => {
      // Handle both single farmer and multi-farmer bills
      if (bill.farmers && bill.farmers.length > 0) {
        // Multi-farmer bill
        bill.farmers.forEach(farmerInBill => {
          const farmerName = farmerInBill.name
          if (!farmerMap.has(farmerName)) {
            farmerMap.set(farmerName, {
              name: farmerName,
              totalBills: 0,
              totalAmount: 0,
              totalBags: 0,
              totalOriginalWeight: 0,
              totalAdjustedWeight: 0,
              lastBillDate: bill.createdAt
            })
          }
          
          const farmer = farmerMap.get(farmerName)
          farmer.totalBills += 1
          farmer.totalAmount += farmerInBill.farmerAmount
          farmer.totalBags += farmerInBill.bags.length
          farmer.totalOriginalWeight += farmerInBill.totalOriginalWeight
          farmer.totalAdjustedWeight += farmerInBill.totalAdjustedWeight
          
          if (new Date(bill.createdAt) > new Date(farmer.lastBillDate)) {
            farmer.lastBillDate = bill.createdAt
          }
        })
      } else {
        // Legacy single farmer bill
        const farmerName = bill.sellerName
        if (farmerName) {
          if (!farmerMap.has(farmerName)) {
            farmerMap.set(farmerName, {
              name: farmerName,
              totalBills: 0,
              totalAmount: 0,
              totalBags: 0,
              totalOriginalWeight: 0,
              totalAdjustedWeight: 0,
              lastBillDate: bill.createdAt
            })
          }
          
          const farmer = farmerMap.get(farmerName)
          farmer.totalBills += 1
          farmer.totalAmount += bill.finalPayable
          farmer.totalBags += bill.bagsCount || 0
          farmer.totalOriginalWeight += bill.originalTotalWeight || 0
          farmer.totalAdjustedWeight += bill.adjustedTotalWeight || bill.totalAdjustedWeight || 0
          
          if (new Date(bill.createdAt) > new Date(farmer.lastBillDate)) {
            farmer.lastBillDate = bill.createdAt
          }
        }
      }
    })
    
    const farmers = Array.from(farmerMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
    
    return NextResponse.json({
      success: true,
      data: farmers
    })
  } catch (error) {
    console.error("Viewer farmers error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch farmers"
        }
      },
      { status: 500 }
    )
  }
}