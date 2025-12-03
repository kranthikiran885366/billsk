"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Package } from "lucide-react"
import type { Commodity } from "@/lib/types"

export function ViewerCommoditiesList() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommodities()
  }, [])

  const fetchCommodities = async () => {
    try {
      const response = await fetch("/api/viewer/commodities")
      const data = await response.json()
      if (data.success) {
        setCommodities(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch commodities:", error)
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
          <h1 className="text-xl font-bold">Commodities - Public View</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              All Commodities
            </CardTitle>
            <CardDescription>Read-only view of commodity rates and details</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity Name</TableHead>
                  <TableHead>Default Rate per 100kg</TableHead>
                  <TableHead>Default Deduction per Bag</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commodities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No commodities found. Commodities will appear here once created by admin.
                    </TableCell>
                  </TableRow>
                ) : (
                  commodities.map((commodity) => (
                    <TableRow key={commodity._id}>
                      <TableCell className="font-medium">{commodity.name}</TableCell>
                      <TableCell>₹{commodity.defaultRatePer100Kg.toLocaleString()}</TableCell>
                      <TableCell>{commodity.defaultDeductionPerBag} kg</TableCell>
                      <TableCell>{new Date(commodity.createdAt).toLocaleDateString()}</TableCell>
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