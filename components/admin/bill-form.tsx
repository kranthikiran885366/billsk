"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, Calculator } from "lucide-react"
import { formatCurrency, formatWeight } from "@/lib/format"
import type { Commodity, Bill, Bag, BillDeductions } from "@/lib/types"

interface BagInput {
  originalWeight: string
  notes: string
}

interface BillFormProps {
  bill?: Bill
  bags?: Bag[]
}

export function BillForm({ bill, bags }: BillFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [commodities, setCommodities] = useState<Commodity[]>([])

  const [formData, setFormData] = useState({
    sellerName: bill?.sellerName || "",
    buyerName: bill?.buyerName || "",
    commodityId: bill?.commodityId || "",
    ratePer100Kg: bill?.ratePer100Kg?.toString() || "",
    deductionPerBag: bill?.deductionPerBag?.toString() || "1",
  })

  const [bagsData, setBagsData] = useState<BagInput[]>(
    bags?.map((b) => ({ originalWeight: b.originalWeight.toString(), notes: b.notes || "" })) || [
      { originalWeight: "", notes: "" },
    ],
  )

  const [deductions, setDeductions] = useState<BillDeductions>(
    bill?.deductions || {
      commission: 0,
      commissionType: "flat",
      transport: 0,
      labour: 0,
      loading: 0,
      weighing: 0,
      misc: 0,
    },
  )

  // Calculation preview
  const [preview, setPreview] = useState({
    originalTotalWeight: 0,
    adjustedTotalWeight: 0,
    totalAmount: 0,
    deductionsTotal: 0,
    finalPayable: 0,
  })

  useEffect(() => {
    fetchCommodities()
  }, [])

  useEffect(() => {
    calculatePreview()
  }, [formData, bagsData, deductions])

  const fetchCommodities = async () => {
    try {
      const res = await fetch("/api/commodities")
      const data = await res.json()
      if (data.success) {
        setCommodities(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch commodities:", error)
    }
  }

  const calculatePreview = () => {
    const ratePer100Kg = Number.parseFloat(formData.ratePer100Kg) || 0
    const deductionPerBag = Number.parseInt(formData.deductionPerBag) as 0 | 1 | 2

    let originalTotal = 0
    let adjustedTotal = 0

    bagsData.forEach((bag) => {
      const weight = Number.parseFloat(bag.originalWeight) || 0
      originalTotal += weight
      // Apply deduction if weight > 100kg
      adjustedTotal += weight > 100 ? weight - deductionPerBag : weight
    })

    const totalAmount = (adjustedTotal / 100) * ratePer100Kg

    // Calculate deductions
    let deductionsTotal = 0
    if (deductions.commissionType === "percentage") {
      deductionsTotal += (totalAmount * deductions.commission) / 100
    } else {
      deductionsTotal += deductions.commission
    }
    deductionsTotal += deductions.transport
    deductionsTotal += deductions.labour
    deductionsTotal += deductions.loading
    deductionsTotal += deductions.weighing
    deductionsTotal += deductions.misc

    setPreview({
      originalTotalWeight: Math.round(originalTotal * 100) / 100,
      adjustedTotalWeight: Math.round(adjustedTotal * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      deductionsTotal: Math.round(deductionsTotal * 100) / 100,
      finalPayable: Math.round((totalAmount - deductionsTotal) * 100) / 100,
    })
  }

  const handleCommodityChange = (commodityId: string) => {
    const commodity = commodities.find((c) => c._id === commodityId)
    if (commodity) {
      setFormData({
        ...formData,
        commodityId,
        ratePer100Kg: commodity.defaultRatePer100Kg.toString(),
        deductionPerBag: commodity.defaultDeductionPerBag.toString(),
      })
    }
  }

  const addBag = () => {
    setBagsData([...bagsData, { originalWeight: "", notes: "" }])
  }

  const removeBag = (index: number) => {
    if (bagsData.length > 1) {
      setBagsData(bagsData.filter((_, i) => i !== index))
    }
  }

  const updateBag = (index: number, field: keyof BagInput, value: string) => {
    const updated = [...bagsData]
    updated[index][field] = value
    setBagsData(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        sellerName: formData.sellerName,
        buyerName: formData.buyerName,
        commodityId: formData.commodityId,
        ratePer100Kg: Number.parseFloat(formData.ratePer100Kg),
        deductionPerBag: Number.parseInt(formData.deductionPerBag) as 0 | 1 | 2,
        bags: bagsData.map((b) => ({
          originalWeight: Number.parseFloat(b.originalWeight),
          notes: b.notes || undefined,
        })),
        deductions,
      }

      const url = bill ? `/api/bills/${bill._id}` : "/api/bills"
      const method = bill ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(bill ? "Bill updated successfully" : "Bill created successfully")
        router.push("/admin/bills")
      } else {
        toast.error(data.error?.message || "Failed to save bill")
      }
    } catch {
      toast.error("An error occurred while saving")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Seller, buyer, and commodity details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sellerName">Seller Name *</Label>
                  <Input
                    id="sellerName"
                    value={formData.sellerName}
                    onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                    placeholder="Enter seller name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerName">Buyer Name *</Label>
                  <Input
                    id="buyerName"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    placeholder="Enter buyer name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commodityId">Commodity *</Label>
                <Select value={formData.commodityId} onValueChange={handleCommodityChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodities.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name} - {formatCurrency(c.defaultRatePer100Kg)}/100kg
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ratePer100Kg">Rate per 100kg *</Label>
                  <Input
                    id="ratePer100Kg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ratePer100Kg}
                    onChange={(e) => setFormData({ ...formData, ratePer100Kg: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductionPerBag">Deduction per Bag (kg) *</Label>
                  <Select
                    value={formData.deductionPerBag}
                    onValueChange={(v) => setFormData({ ...formData, deductionPerBag: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 kg (No deduction)</SelectItem>
                      <SelectItem value="1">1 kg</SelectItem>
                      <SelectItem value="2">2 kg</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Applied when bag weight exceeds 100kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bags */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bags</CardTitle>
                <CardDescription>Add bag weights ({bagsData.length} bags)</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addBag}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bag
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bagsData.map((bag, index) => (
                  <div key={index} className="flex items-end gap-3">
                    <div className="w-16 text-sm text-muted-foreground">Bag {index + 1}</div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="500"
                        value={bag.originalWeight}
                        onChange={(e) => updateBag(index, "originalWeight", e.target.value)}
                        placeholder="Weight (kg)"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={bag.notes}
                        onChange={(e) => updateBag(index, "notes", e.target.value)}
                        placeholder="Notes (optional)"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBag(index)}
                      disabled={bagsData.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle>Deductions</CardTitle>
              <CardDescription>Charges to be deducted from total amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Commission</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={deductions.commission}
                      onChange={(e) =>
                        setDeductions({ ...deductions, commission: Number.parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                    <Select
                      value={deductions.commissionType}
                      onValueChange={(v) =>
                        setDeductions({ ...deductions, commissionType: v as "flat" | "percentage" })
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Transport</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductions.transport}
                    onChange={(e) =>
                      setDeductions({ ...deductions, transport: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Labour</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductions.labour}
                    onChange={(e) => setDeductions({ ...deductions, labour: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loading</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductions.loading}
                    onChange={(e) => setDeductions({ ...deductions, loading: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weighing</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductions.weighing}
                    onChange={(e) => setDeductions({ ...deductions, weighing: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Miscellaneous</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductions.misc}
                    onChange={(e) => setDeductions({ ...deductions, misc: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculation Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Weight</span>
                  <span className="font-mono">{formatWeight(preview.originalTotalWeight)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adjusted Weight</span>
                  <span className="font-mono">{formatWeight(preview.adjustedTotalWeight)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Weight Deduction</span>
                  <span className="font-mono">
                    -{formatWeight(preview.originalTotalWeight - preview.adjustedTotalWeight)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-mono">{formatCurrency(preview.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Total Deductions</span>
                  <span className="font-mono">-{formatCurrency(preview.deductionsTotal)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Final Payable</span>
                  <span className="text-primary">{formatCurrency(preview.finalPayable)}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : bill ? (
                    "Update Bill"
                  ) : (
                    "Create Bill"
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
