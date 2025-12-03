"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Package, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Commodity } from "@/lib/types"

export function AdminCommoditiesList() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    defaultRatePer100Kg: "",
    defaultDeductionPerBag: "1",
  })

  useEffect(() => {
    fetchCommodities()
  }, [])

  const fetchCommodities = async () => {
    setIsLoading(true)
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

  const openDialog = (commodity?: Commodity) => {
    if (commodity) {
      setEditingCommodity(commodity)
      setFormData({
        name: commodity.name,
        defaultRatePer100Kg: commodity.defaultRatePer100Kg.toString(),
        defaultDeductionPerBag: commodity.defaultDeductionPerBag.toString(),
      })
    } else {
      setEditingCommodity(null)
      setFormData({
        name: "",
        defaultRatePer100Kg: "",
        defaultDeductionPerBag: "1",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const rate = Number.parseFloat(formData.defaultRatePer100Kg)
      
      if (!formData.name.trim()) {
        toast.error("Commodity name is required")
        setIsSaving(false)
        return
      }
      
      if (isNaN(rate) || rate <= 0) {
        toast.error("Rate must be a positive number")
        setIsSaving(false)
        return
      }

      const payload = {
        name: formData.name.trim(),
        defaultRatePer100Kg: rate,
        defaultDeductionPerBag: Number.parseInt(formData.defaultDeductionPerBag, 10) as 0 | 1 | 2,
      }

      console.log('Creating commodity with payload:', payload)

      const url = editingCommodity ? `/api/commodities/${editingCommodity._id}` : "/api/commodities"
      const method = editingCommodity ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('API response:', data)

      if (data.success) {
        toast.success(editingCommodity ? "Commodity updated successfully" : "Commodity created successfully")
        setIsDialogOpen(false)
        fetchCommodities()
      } else {
        console.error('Validation error:', data.error)
        if (data.error?.details) {
          console.error('Validation details:', JSON.stringify(data.error.details, null, 2))
        }
        const errorMsg = data.error?.details 
          ? `${data.error.message}: ${JSON.stringify(data.error.details)}`
          : data.error?.message || "Failed to save commodity"
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/commodities/${deleteId}`, { method: "DELETE" })
      const data = await res.json()

      if (data.success) {
        toast.success("Commodity deleted successfully")
        fetchCommodities()
      } else {
        toast.error(data.error?.message || "Failed to delete commodity")
      }
    } catch {
      toast.error("Failed to delete commodity")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commodities</h1>
          <p className="text-muted-foreground">Manage commodity types and default rates</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Commodity
        </Button>
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
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{commodity.name}</CardTitle>
                    <CardDescription>Added {formatDate(commodity.createdAt)}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(commodity)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(commodity._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
            <CardContent className="py-12 text-center text-muted-foreground">
              No commodities found. Add your first commodity to get started.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCommodity ? "Edit Commodity" : "Add Commodity"}</DialogTitle>
            <DialogDescription>
              {editingCommodity
                ? "Update commodity details and default rates"
                : "Add a new commodity with default billing settings"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Commodity Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Rice, Wheat, Cotton"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Default Rate per 100kg *</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.defaultRatePer100Kg}
                  onChange={(e) => setFormData({ ...formData, defaultRatePer100Kg: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deduction">Default Bag Deduction *</Label>
                <Select
                  value={formData.defaultDeductionPerBag}
                  onValueChange={(v) => setFormData({ ...formData, defaultDeductionPerBag: v })}
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
                <p className="text-xs text-muted-foreground">Automatically deducted when bag weight exceeds 100kg</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingCommodity ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commodity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this commodity? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
