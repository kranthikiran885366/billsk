"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, User, FileText, Eye, TrendingUp } from "lucide-react"
import type { Bill } from "@/lib/types"

interface ViewerFarmerDetailProps {
  farmerName: string
}

export function ViewerFarmerDetail({ farmerName }: ViewerFarmerDetailProps) {
  const [bills, setBills] = useState<Bill[]>([])
  const [stats, setStats] = useState({
    totalBills: 0,
    totalAmount: 0,
    avgAmount: 0,
    paidBills: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFarmerBills()
  }, [farmerName])

  const fetchFarmerBills = async () => {
    try {
      const response = await fetch(`/api/viewer/farmers/${encodeURIComponent(farmerName)}/bills`)
      const data = await response.json()
      if (data.success) {
        setBills(data.data)
        calculateStats(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch farmer bills:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (billsData: Bill[]) => {
    const totalBills = billsData.length
    const totalAmount = billsData.reduce((sum, bill) => sum + bill.finalPayable, 0)
    const avgAmount = totalBills > 0 ? totalAmount / totalBills : 0
    const paidBills = billsData.filter(bill => bill.status === 'paid').length

    setStats({ totalBills, totalAmount, avgAmount, paidBills })
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/viewer/farmers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Farmers
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Farmer Details - {farmerName}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBills}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Bill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Math.round(stats.avgAmount).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Paid Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidBills}/{stats.totalBills}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Bills for {farmerName}
            </CardTitle>
            <CardDescription>All billing records for this farmer</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill._id}>
                    <TableCell className="font-mono">{bill.invoiceId}</TableCell>
                    <TableCell>{bill.buyerName}</TableCell>
                    <TableCell>{bill.commodityName}</TableCell>
                    <TableCell>{bill.adjustedTotalWeight}</TableCell>
                    <TableCell>₹{bill.finalPayable.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={bill.status === 'paid' ? 'default' : 'secondary'}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link href={`/viewer/bills/${bill._id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}