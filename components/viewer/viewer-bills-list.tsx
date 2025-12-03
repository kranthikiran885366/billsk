"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, ArrowLeft } from "lucide-react"
import type { Bill } from "@/lib/types"

export function ViewerBillsList() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/viewer/bills")
      const data = await response.json()
      if (data.success) {
        setBills(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/viewer">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Bills - Public View</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
            <CardDescription>Read-only view of all billing records</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No bills found. Bills will appear here once created by admin.
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => {
                    const sellerDisplay = bill.sellerName || 
                      (bill.farmers && bill.farmers.length > 0 ? 
                        bill.farmers.length + " Farmers" : 
                        "N/A")
                    
                    return (
                      <TableRow key={bill._id}>
                        <TableCell className="font-mono">{bill.invoiceId}</TableCell>
                        <TableCell>{sellerDisplay}</TableCell>
                        <TableCell>{bill.buyerName}</TableCell>
                        <TableCell>{bill.commodityName}</TableCell>
                        <TableCell>₹{bill.finalPayable.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={bill.status === "paid" ? "default" : "secondary"}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/viewer/bills/${bill._id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}