"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Users, Package } from "lucide-react"
import { toast } from "sonner"
import type { Commodity, CreateBillInput } from "@/lib/types"

interface FarmerData {
  name: string
  ratePer100Kg: number
  bags: { originalWeight: number; deductionKg: 0 | 1 | 2; notes: string }[]
}

export function MultiFarmerBillForm() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [formData, setFormData] = useState({
    farmers: [] as FarmerData[],
    commodityId: "",
    defaultRatePer100Kg: 0,
    defaultDeductionPerBag: 1 as 0 | 1 | 2,
    deductions: {
      commission: 0,
      commissionType: "flat" as "flat" | "percentage",
      transport: 0,
      labour: 0,
      loading: 0,
      weighing: 0,
      misc: 0
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchCommodities()
  }, [])

  const fetchCommodities = async () => {
    try {
      const response = await fetch("/api/commodities")
      const data = await response.json()
      if (data.success) {
        setCommodities(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch commodities:", error)
    }
  }

  const addFarmer = () => {
    setFormData(prev => ({
      ...prev,
      farmers: [...prev.farmers, { name: "", ratePer100Kg: prev.defaultRatePer100Kg, bags: [] }]
    }))
  }

  const removeFarmer = (farmerIndex: number) => {
    setFormData(prev => ({
      ...prev,
      farmers: prev.farmers.filter((_, index) => index !== farmerIndex)
    }))
  }

  const updateFarmer = (farmerIndex: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      farmers: prev.farmers.map((farmer, index) => 
        index === farmerIndex ? { ...farmer, [field]: value } : farmer
      )
    }))
  }

  const addBag = (farmerIndex: number) => {
    setFormData(prev => ({
      ...prev,
      farmers: prev.farmers.map((farmer, index) => 
        index === farmerIndex 
          ? { ...farmer, bags: [...farmer.bags, { originalWeight: 0, deductionKg: prev.defaultDeductionPerBag, notes: "" }] }
          : farmer
      )
    }))
  }

  const removeBag = (farmerIndex: number, bagIndex: number) => {
    setFormData(prev => ({
      ...prev,
      farmers: prev.farmers.map((farmer, index) => 
        index === farmerIndex 
          ? { ...farmer, bags: farmer.bags.filter((_, bIndex) => bIndex !== bagIndex) }
          : farmer
      )
    }))
  }

  const updateBag = (farmerIndex: number, bagIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      farmers: prev.farmers.map((farmer, fIndex) => 
        fIndex === farmerIndex 
          ? {
              ...farmer,
              bags: farmer.bags.map((bag, bIndex) => 
                bIndex === bagIndex ? { ...bag, [field]: value } : bag
              )
            }
          : farmer
      )
    }))
  }

  const calculateFarmerTotals = (farmer: FarmerData) => {
    let totalBags = 0
    let totalOriginalWeight = 0
    let totalAdjustedWeight = 0

    farmer.bags.forEach(bag => {
      totalBags++
      totalOriginalWeight += bag.originalWeight
      totalAdjustedWeight += (bag.originalWeight - bag.deductionKg)
    })

    const totalAmount = (totalAdjustedWeight / 100) * farmer.ratePer100Kg
    return { totalBags, totalOriginalWeight, totalAdjustedWeight, totalAmount }
  }

  const calculateOverallTotals = () => {
    let totalBags = 0
    let totalOriginalWeight = 0
    let totalAdjustedWeight = 0
    let totalAmount = 0

    formData.farmers.forEach(farmer => {
      const farmerTotals = calculateFarmerTotals(farmer)
      totalBags += farmerTotals.totalBags
      totalOriginalWeight += farmerTotals.totalOriginalWeight
      totalAdjustedWeight += farmerTotals.totalAdjustedWeight
      totalAmount += farmerTotals.totalAmount
    })

    const totalDeductions = Object.values(formData.deductions).reduce((sum, val) => 
      typeof val === 'number' ? sum + val : sum, 0
    )
    const finalPayable = totalAmount - totalDeductions

    return { totalBags, totalOriginalWeight, totalAdjustedWeight, totalAmount, finalPayable }
  }

  const createIndividualBill = async (farmerIndex: number) => {
    const farmer = formData.farmers[farmerIndex]
    
    if (!formData.commodityId || !farmer.name || farmer.bags.length === 0) {
      toast.error("Please fill all required fields for this farmer")
      return
    }

    // Validate bag weights
    const invalidBags = farmer.bags.filter(bag => !bag.originalWeight || bag.originalWeight <= 0)
    if (invalidBags.length > 0) {
      toast.error("All bags must have valid weights greater than 0")
      return
    }

    if (!farmer.ratePer100Kg || farmer.ratePer100Kg <= 0) {
      toast.error("Please set a valid rate for this farmer")
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        sellerName: farmer.name,
        buyerName: "Buyer", // Default buyer name
        commodityId: formData.commodityId,
        ratePer100Kg: farmer.ratePer100Kg,
        deductionPerBag: formData.defaultDeductionPerBag,
        bags: farmer.bags.map(bag => ({
          originalWeight: bag.originalWeight,
          notes: bag.notes || undefined
        })),
        deductions: formData.deductions
      }

      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Bill created successfully for ${farmer.name}`)
      } else {
        toast.error(data.error?.message || `Failed to create bill for ${farmer.name}`)
      }
    } catch (error) {
      toast.error(`Network error occurred for ${farmer.name}`)
    } finally {
      setIsLoading(false)
    }
  }

  const createAllBills = async () => {
    if (!formData.commodityId || formData.farmers.length === 0) {
      toast.error("Please fill all required fields")
      return
    }

    if (formData.farmers.some(f => !f.name || f.bags.length === 0)) {
      toast.error("Each farmer must have a name and at least one bag")
      return
    }

    setIsLoading(true)
    let successCount = 0
    
    for (let i = 0; i < formData.farmers.length; i++) {
      try {
        const farmer = formData.farmers[i]
        const payload = {
          sellerName: farmer.name,
          buyerName: "Buyer", // Default buyer name
          commodityId: formData.commodityId,
          ratePer100Kg: farmer.ratePer100Kg,
          deductionPerBag: formData.defaultDeductionPerBag,
          bags: farmer.bags.map(bag => ({
            originalWeight: bag.originalWeight,
            notes: bag.notes || undefined
          })),
          deductions: formData.deductions
        }

        const response = await fetch("/api/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        const data = await response.json()
        if (data.success) {
          successCount++
        }
      } catch (error) {
        console.error(`Error creating bill for farmer ${i}:`, error)
      }
    }
    
    setIsLoading(false)
    
    if (successCount === formData.farmers.length) {
      toast.success(`All ${successCount} bills created successfully!`)
      // Reset form
      setFormData({
        farmers: [],
        commodityId: "",
        defaultRatePer100Kg: 0,
        defaultDeductionPerBag: 1,
        deductions: {
          commission: 0,
          commissionType: "flat",
          transport: 0,
          labour: 0,
          loading: 0,
          weighing: 0,
          misc: 0
        }
      })
    } else {
      toast.error(`Only ${successCount} out of ${formData.farmers.length} bills created successfully`)
    }
  }

  const totals = calculateOverallTotals()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Multi-Farmer Bill
          </CardTitle>
          <CardDescription>Create bills for multiple farmers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Commodity Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commodity">Commodity *</Label>
                <Select
                  value={formData.commodityId}
                  onValueChange={(value) => {
                    const commodity = commodities.find(c => c._id === value)
                    setFormData(prev => ({
                      ...prev,
                      commodityId: value,
                      defaultRatePer100Kg: commodity?.defaultRatePer100Kg || 0,
                      defaultDeductionPerBag: commodity?.defaultDeductionPerBag || 1,
                      farmers: prev.farmers.map(farmer => ({
                        ...farmer,
                        ratePer100Kg: commodity?.defaultRatePer100Kg || farmer.ratePer100Kg
                      }))
                    }))
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {commodities.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        Loading commodities...
                      </SelectItem>
                    ) : (
                      commodities.map((commodity) => (
                        <SelectItem key={commodity._id} value={commodity._id} className="py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{commodity.name}</span>
                            <span className="text-sm text-muted-foreground">
                              ₹{commodity.defaultRatePer100Kg}/100kg • {commodity.defaultDeductionPerBag}kg deduction
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.commodityId && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {commodities.find(c => c._id === formData.commodityId)?.name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate">Default Rate per 100kg (₹)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={formData.defaultRatePer100Kg}
                  onChange={(e) => {
                    const newRate = Number(e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      defaultRatePer100Kg: newRate,
                      farmers: prev.farmers.map(farmer => ({
                        ...farmer,
                        ratePer100Kg: newRate
                      }))
                    }))
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="deduction">Default Deduction per Bag (kg)</Label>
                <Select
                  value={formData.defaultDeductionPerBag.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultDeductionPerBag: Number(value) as 0 | 1 | 2 }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 kg</SelectItem>
                    <SelectItem value="1">1 kg</SelectItem>
                    <SelectItem value="2">2 kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Farmers Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Farmers & Bags</h3>
                <Button type="button" onClick={addFarmer} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Farmer
                </Button>
              </div>

              {formData.farmers.map((farmer, farmerIndex) => (
                <Card key={farmerIndex} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Farmer {farmerIndex + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFarmer(farmerIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Farmer Name *</Label>
                        <Input
                          value={farmer.name}
                          onChange={(e) => updateFarmer(farmerIndex, "name", e.target.value)}
                          placeholder="Enter farmer name"
                          required
                        />
                      </div>
                      <div>
                        <Label>Rate per 100kg (₹) *</Label>
                        <Input
                          type="number"
                          value={farmer.ratePer100Kg}
                          onChange={(e) => updateFarmer(farmerIndex, "ratePer100Kg", Number(e.target.value))}
                          placeholder="Rate per 100kg"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Bags</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addBag(farmerIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Bag
                        </Button>
                      </div>

                      {farmer.bags.map((bag, bagIndex) => (
                        <div key={bagIndex} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded">
                          <div className="col-span-3">
                            <Label className="text-xs">Weight (kg)</Label>
                            <Input
                              type="number"
                              value={bag.originalWeight}
                              onChange={(e) => updateBag(farmerIndex, bagIndex, "originalWeight", Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Label className="text-xs">Deduction</Label>
                            <Select
                              value={bag.deductionKg.toString()}
                              onValueChange={(value) => updateBag(farmerIndex, bagIndex, "deductionKg", Number(value))}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0 kg</SelectItem>
                                <SelectItem value="1">1 kg</SelectItem>
                                <SelectItem value="2">2 kg</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs">Adjusted</Label>
                            <div className="h-9 px-3 py-2 bg-white border rounded text-sm">
                              {bag.originalWeight - bag.deductionKg} kg
                            </div>
                          </div>

                          <div className="col-span-4">
                            <Label className="text-xs">Notes</Label>
                            <Input
                              value={bag.notes}
                              onChange={(e) => updateBag(farmerIndex, bagIndex, "notes", e.target.value)}
                              placeholder="Optional notes"
                            />
                          </div>

                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBag(farmerIndex, bagIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Farmer Summary and Individual Bill Button */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-5 gap-3 text-sm flex-1">
                          <div>
                            <p className="text-gray-600">Bags</p>
                            <p className="font-semibold">{farmer.bags.length}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Actual Weight</p>
                            <p className="font-semibold">{calculateFarmerTotals(farmer).totalOriginalWeight} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Deduction</p>
                            <p className="font-semibold text-red-600">-{(calculateFarmerTotals(farmer).totalOriginalWeight - calculateFarmerTotals(farmer).totalAdjustedWeight)} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Final Weight</p>
                            <p className="font-semibold">{calculateFarmerTotals(farmer).totalAdjustedWeight} kg</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Amount</p>
                            <p className="font-semibold text-green-600">₹{calculateFarmerTotals(farmer).totalAmount.toLocaleString()}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => createIndividualBill(farmerIndex)}
                          disabled={isLoading || !farmer.name || farmer.bags.length === 0 || !formData.commodityId || farmer.bags.some(bag => !bag.originalWeight || bag.originalWeight <= 0) || !farmer.ratePer100Kg || farmer.ratePer100Kg <= 0}
                          className="ml-4"
                        >
                          Create Bill
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Deductions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Commission (₹)</Label>
                    <Input
                      type="number"
                      value={formData.deductions.commission}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        deductions: { ...prev.deductions, commission: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Transport (₹)</Label>
                    <Input
                      type="number"
                      value={formData.deductions.transport}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        deductions: { ...prev.deductions, transport: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Labour (₹)</Label>
                    <Input
                      type="number"
                      value={formData.deductions.labour}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        deductions: { ...prev.deductions, labour: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">Overall Bill Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Bags</p>
                    <p className="font-semibold">{totals.totalBags}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Actual Weight</p>
                    <p className="font-semibold">{totals.totalOriginalWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Deduction</p>
                    <p className="font-semibold text-red-600">-{(totals.totalOriginalWeight - totals.totalAdjustedWeight)} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Final Weight</p>
                    <p className="font-semibold">{totals.totalAdjustedWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount</p>
                    <p className="font-semibold text-green-600">₹{totals.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button 
                type="button" 
                onClick={createAllBills}
                disabled={isLoading || formData.farmers.length === 0} 
                className="w-full"
              >
                {isLoading ? "Creating Bills..." : "Create All Bills"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                This will create {formData.farmers.length} separate bills
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}