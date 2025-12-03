"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Package, Users, Scale, Calculator } from "lucide-react"
import type { Bill, Bag } from "@/lib/types"
import { MultiFarmerBillViewer } from "./multi-farmer-bill-viewer"

interface ViewerBillDetailProps {
  billId: string
}

export function ViewerBillDetail({ billId }: ViewerBillDetailProps) {
  const [bill, setBill] = useState<Bill | null>(null)
  const [bags, setBags] = useState<Bag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBillDetail()
  }, [billId])

  const fetchBillDetail = async () => {
    try {
      const [billResponse, bagsResponse] = await Promise.all([
        fetch(`/api/viewer/bills/${billId}`),
        fetch(`/api/viewer/bills/${billId}/bags`)
      ])
      
      const billData = await billResponse.json()
      const bagsData = await bagsResponse.json()
      
      if (billData.success) setBill(billData.data)
      if (bagsData.success) setBags(bagsData.data)
    } catch (error) {
      console.error("Failed to fetch bill detail:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  if (!bill) {
    return <div className="flex justify-center p-8">Bill not found</div>
  }

  // Check if this is a multi-farmer bill
  if (bill.farmers && bill.farmers.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/viewer/bills">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bills
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Multi-Farmer Bill - {bill.invoiceId}</h1>
            <Badge variant={bill.status === 'paid' ? 'default' : 'secondary'}>
              {bill.status}
            </Badge>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <MultiFarmerBillViewer bill={bill} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/viewer/bills">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bills
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Bill Details - {bill.invoiceId}</h1>
          <Badge variant={bill.status === 'paid' ? 'default' : 'secondary'}>
            {bill.status}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Bill Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Buyer & Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Buyer</label>
                <p className="text-lg font-semibold">{bill.buyerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Seller (Farmer)</label>
                <p className="text-lg font-semibold">{bill.sellerName}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Commodity Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Commodity</label>
                <p className="text-lg font-semibold">{bill.commodityName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Rate per 100kg</label>
                <p className="text-lg font-semibold">₹{bill.ratePer100Kg.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Deduction per Bag</label>
                <p className="text-lg font-semibold">{bill.deductionPerBag} kg</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bags Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Bags & Weights
            </CardTitle>
            <CardDescription>Individual bag weights and adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag #</TableHead>
                  <TableHead>Original Weight (kg)</TableHead>
                  <TableHead>Adjusted Weight (kg)</TableHead>
                  <TableHead>Deduction (kg)</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bags.map((bag) => (
                  <TableRow key={bag._id}>
                    <TableCell className="font-medium">{bag.bagNumber}</TableCell>
                    <TableCell>{bag.originalWeight}</TableCell>
                    <TableCell>{bag.adjustedWeight}</TableCell>
                    <TableCell>{bag.originalWeight - bag.adjustedWeight}</TableCell>
                    <TableCell>{bag.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Weight Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weight Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Bags</p>
                <p className="text-2xl font-bold text-blue-600">{bill.bagsCount}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Original Weight</p>
                <p className="text-2xl font-bold text-orange-600">{bill.originalTotalWeight} kg</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Adjusted Weight</p>
                <p className="text-2xl font-bold text-green-600">{bill.adjustedTotalWeight} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Financial Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">₹{bill.totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600">
                  ({bill.adjustedTotalWeight} kg ÷ 100 × ₹{bill.ratePer100Kg})
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Deductions:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Commission ({bill.deductions.commissionType}):</span>
                    <span>₹{bill.deductions.commission.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport:</span>
                    <span>₹{bill.deductions.transport.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labour:</span>
                    <span>₹{bill.deductions.labour.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <span>₹{bill.deductions.loading.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weighing:</span>
                    <span>₹{bill.deductions.weighing.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Miscellaneous:</span>
                    <span>₹{bill.deductions.misc.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Final Payable Amount:</span>
                <span className="text-green-600">₹{bill.finalPayable.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}