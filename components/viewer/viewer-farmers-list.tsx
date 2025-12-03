"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, Search, Eye } from "lucide-react"
import type { Bill } from "@/lib/types"

interface FarmerSummary {
  name: string
  totalBills: number
  totalAmount: number
  totalBags: number
  totalOriginalWeight: number
  totalAdjustedWeight: number
  lastBillDate: string
}

export function ViewerFarmersList() {
  const [farmers, setFarmers] = useState<FarmerSummary[]>([])
  const [filteredFarmers, setFilteredFarmers] = useState<FarmerSummary[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFarmers()
  }, [])

  useEffect(() => {
    const filtered = farmers.filter(farmer =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredFarmers(filtered)
  }, [farmers, searchTerm])

  const fetchFarmers = async () => {
    try {
      const response = await fetch("/api/viewer/farmers")
      const data = await response.json()
      if (data.success) {
        setFarmers(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch farmers:", error)
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
          <h1 className="text-xl font-bold">Farmers - Public View</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Farmers
            </CardTitle>
            <CardDescription>Read-only view of farmer information and transaction history</CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search farmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer Name</TableHead>
                  <TableHead>Total Bills</TableHead>
                  <TableHead>Total Bags</TableHead>
                  <TableHead>Total Weight</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Last Bill Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFarmers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No farmers found. Farmers will appear here once bills are created.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFarmers.map((farmer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>{farmer.totalBills}</TableCell>
                    <TableCell>{farmer.totalBags}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Original: {farmer.totalOriginalWeight} kg</div>
                        <div className="text-green-600">Adjusted: {farmer.totalAdjustedWeight} kg</div>
                      </div>
                    </TableCell>
                    <TableCell>₹{farmer.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(farmer.lastBillDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link href={`/viewer/farmers/${encodeURIComponent(farmer.name)}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}