"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, Pencil, Trash2, Printer, CheckCircle, Loader2 } from "lucide-react"
import { formatCurrency, formatDate, formatWeight } from "@/lib/format"
import type { Bill, Bag } from "@/lib/types"

interface BillDetailProps {
  billId: string
}

export function BillDetail({ billId }: BillDetailProps) {
  const router = useRouter()
  const [bill, setBill] = useState<Bill | null>(null)
  const [bags, setBags] = useState<Bag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchBill()
  }, [billId])

  const fetchBill = async () => {
    try {
      const [billRes, bagsRes] = await Promise.all([fetch(`/api/bills/${billId}`), fetch(`/api/bills/${billId}/bags`)])

      const billData = await billRes.json()
      const bagsData = await bagsRes.json()

      if (billData.success) {
        setBill(billData.data)
      }
      if (bagsData.success) {
        setBags(bagsData.data)
      }
    } catch (error) {
      console.error("Failed to fetch bill:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Bill marked as ${newStatus}`)
        setBill(data.data)
      } else {
        toast.error(data.error?.message || "Failed to update status")
      }
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" })
      const data = await res.json()

      if (data.success) {
        toast.success("Bill deleted successfully")
        router.push("/admin/bills")
      } else {
        toast.error(data.error?.message || "Failed to delete bill")
      }
    } catch {
      toast.error("Failed to delete bill")
    } finally {
      setIsDeleting(false)
      setShowDelete(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Bill not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/bills">Back to Bills</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/bills">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{bill.invoiceId}</h1>
            <p className="text-muted-foreground">Created on {formatDate(bill.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/bills/${billId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status and quick actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  bill.status === "paid"
                    ? "bg-success/10 text-success"
                    : bill.status === "finalized"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {bill.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {bill.status === "draft" && (
                <Button size="sm" onClick={() => handleStatusChange("finalized")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Finalized
                </Button>
              )}
              {bill.status === "finalized" && (
                <Button size="sm" onClick={() => handleStatusChange("paid")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Paid
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Farmers</p>
                  <div className="mt-1">
                    {bill.farmers && bill.farmers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {bill.farmers.map((farmer, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-sm font-medium">
                            {farmer.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="font-medium text-muted-foreground">{bill.sellerName || "No farmers specified"}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                  <p className="font-medium">{bill.buyerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commodity</p>
                  <p className="font-medium">{bill.commodityName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate per 100kg</p>
                  <p className="font-medium">{formatCurrency(bill.ratePer100Kg)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Bag Deduction</p>
                  <p className="font-medium">{bill.defaultDeductionPerBag || bill.deductionPerBag || 0} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bags</p>
                  <p className="font-medium">{bill.totalBagsCount || bill.bagsCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farmers and Bags */}
          {bill.farmers && bill.farmers.length > 0 ? (
            <div className="space-y-6">
              {bill.farmers.map((farmer, farmerIdx) => (
                <Card key={farmerIdx}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Farmer: {farmer.name}</span>
                      <div className="text-sm text-muted-foreground">
                        {farmer.bags.length} bags • {formatWeight(farmer.totalAdjustedWeight)} total
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-medium">Bag #</th>
                            <th className="text-right py-2 px-3 font-medium">Original</th>
                            <th className="text-right py-2 px-3 font-medium">Adjusted</th>
                            <th className="text-right py-2 px-3 font-medium">Deduction</th>
                            <th className="text-left py-2 px-3 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {farmer.bags.map((bag, bagIdx) => (
                            <tr key={bagIdx} className="border-b border-border last:border-0">
                              <td className="py-2 px-3">{bag.bagNumber}</td>
                              <td className="py-2 px-3 text-right font-mono">{formatWeight(bag.originalWeight)}</td>
                              <td className="py-2 px-3 text-right font-mono">{formatWeight(bag.adjustedWeight)}</td>
                              <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                                -{formatWeight(bag.originalWeight - bag.adjustedWeight)}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">{bag.notes || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/50 font-medium">
                            <td className="py-2 px-3">Subtotal</td>
                            <td className="py-2 px-3 text-right font-mono">{formatWeight(farmer.totalOriginalWeight)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatWeight(farmer.totalAdjustedWeight)}</td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                              -{formatWeight(farmer.totalOriginalWeight - farmer.totalAdjustedWeight)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {formatCurrency(farmer.farmerAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Overall Total */}
              <Card>
                <CardContent className="pt-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium">
                      <div className="text-center">
                        <p className="text-muted-foreground">Total Bags</p>
                        <p className="text-lg">{bill.totalBagsCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Original Weight</p>
                        <p className="text-lg font-mono">{formatWeight(bill.totalOriginalWeight)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Adjusted Weight</p>
                        <p className="text-lg font-mono">{formatWeight(bill.totalAdjustedWeight)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-mono">{formatCurrency(bill.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Legacy single farmer view */
            <Card>
              <CardHeader>
                <CardTitle>Bags Detail</CardTitle>
                <CardDescription>Individual bag weights and adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium">Bag #</th>
                        <th className="text-right py-2 px-3 font-medium">Original</th>
                        <th className="text-right py-2 px-3 font-medium">Adjusted</th>
                        <th className="text-right py-2 px-3 font-medium">Deduction</th>
                        <th className="text-left py-2 px-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bags.map((bag) => (
                        <tr key={bag._id} className="border-b border-border last:border-0">
                          <td className="py-2 px-3">{bag.bagNumber}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatWeight(bag.originalWeight)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatWeight(bag.adjustedWeight)}</td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                            -{formatWeight(bag.originalWeight - bag.adjustedWeight)}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">{bag.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-medium">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right font-mono">{formatWeight(bill.originalTotalWeight || bill.totalOriginalWeight)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatWeight(bill.adjustedTotalWeight || bill.totalAdjustedWeight)}</td>
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                          -{formatWeight((bill.originalTotalWeight || bill.totalOriginalWeight) - (bill.adjustedTotalWeight || bill.totalAdjustedWeight))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Amount breakdown */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Amount Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-mono">{formatCurrency(bill.totalAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatWeight(bill.totalAdjustedWeight || bill.adjustedTotalWeight)} @ {formatCurrency(bill.ratePer100Kg)}/100kg
                </p>
              </div>

              <div className="pt-2 border-t border-border space-y-2 text-sm">
                <p className="text-muted-foreground font-medium">Deductions:</p>
                <div className="space-y-1 pl-2">
                  <div className="flex justify-between">
                    <span>
                      Commission (
                      {bill.deductions.commissionType === "percentage" ? `${bill.deductions.commission}%` : "Flat"})
                    </span>
                    <span className="font-mono text-muted-foreground">
                      -
                      {formatCurrency(
                        bill.deductions.commissionType === "percentage"
                          ? (bill.totalAmount * bill.deductions.commission) / 100
                          : bill.deductions.commission,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport</span>
                    <span className="font-mono text-muted-foreground">
                      -{formatCurrency(bill.deductions.transport)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labour</span>
                    <span className="font-mono text-muted-foreground">-{formatCurrency(bill.deductions.labour)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading</span>
                    <span className="font-mono text-muted-foreground">-{formatCurrency(bill.deductions.loading)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weighing</span>
                    <span className="font-mono text-muted-foreground">-{formatCurrency(bill.deductions.weighing)}</span>
                  </div>
                  {bill.deductions.misc > 0 && (
                    <div className="flex justify-between">
                      <span>Misc</span>
                      <span className="font-mono text-muted-foreground">-{formatCurrency(bill.deductions.misc)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-xl font-semibold">
                  <span>Final Payable</span>
                  <span className="text-primary">{formatCurrency(bill.finalPayable)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {bill.invoiceId}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
