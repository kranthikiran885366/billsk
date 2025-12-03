"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Commodity } from "@/lib/types"

export function CommoditiesListViewer() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCommodities()
  }, [])

  const fetchCommodities = async () => {
    try {
      const res = await fetch("/api/commodities")
      const data = await res.json()
      if (data.success) {
        setCommodities(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch commodities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commodities</h1>
        <p className="text-muted-foreground">View available commodities and their default rates</p>
      </div>

      {/* Commodities grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-48" />
                  <div className="h-4 bg-muted rounded w-36" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : commodities.length > 0 ? (
          commodities.map((commodity) => (
            <Card key={commodity._id}>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{commodity.name}</CardTitle>
                  <CardDescription>Added {formatDate(commodity.createdAt)}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Default Rate</span>
                    <span className="font-medium">{formatCurrency(commodity.defaultRatePer100Kg)} / 100kg</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bag Deduction</span>
                    <span className="font-medium">{commodity.defaultDeductionPerBag} kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">No commodities found</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
