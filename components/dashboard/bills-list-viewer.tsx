"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, FileText, Download, Eye, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { formatCurrency, formatDate, formatWeight } from "@/lib/format"
import type { Bill, Bag, Commodity } from "@/lib/types"

interface BillsResponse {
  bills: Bill[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function BillsListViewer() {
  const [bills, setBills] = useState<Bill[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [selectedBillBags, setSelectedBillBags] = useState<Bag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState({
    search: "",
    commodityId: "",
    status: "",
    startDate: "",
    endDate: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchBills = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.search) params.set("search", filters.search)
      if (filters.commodityId) params.set("commodityId", filters.commodityId)
      if (filters.status) params.set("status", filters.status)
      if (filters.startDate) params.set("startDate", filters.startDate)
      if (filters.endDate) params.set("endDate", filters.endDate)

      const res = await fetch(`/api/bills?${params}`)
      const data = await res.json()

      if (data.success) {
        setBills(data.data.bills)
        setPagination({
          ...pagination,
          total: data.data.total,
          totalPages: data.data.totalPages,
        })
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination, filters])

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

  useEffect(() => {
    fetchBills()
    fetchCommodities()
  }, [fetchBills])

  const handleViewBill = async (bill: Bill) => {
    setSelectedBill(bill)
    setIsDetailOpen(true)

    // Fetch bags for this bill
    try {
      const res = await fetch(`/api/bills/${bill._id}/bags`)
      const data = await res.json()
      if (data.success) {
        setSelectedBillBags(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch bags:", error)
    }
  }

  const handleExportCSV = () => {
    // Generate CSV from visible bills
    const headers = [
      "Invoice ID",
      "Date",
      "Seller",
      "Buyer",
      "Commodity",
      "Total Weight (kg)",
      "Amount",
      "Final Payable",
      "Status",
    ]
    const rows = bills.map((bill) => [
      bill.invoiceId,
      formatDate(bill.createdAt),
      bill.sellerName,
      bill.buyerName,
      bill.commodityName,
      bill.adjustedTotalWeight,
      bill.totalAmount,
      bill.finalPayable,
      bill.status,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bills-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
          <p className="text-muted-foreground">View all commodity bills and invoices</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice, seller, or buyer..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value })
                  setPagination({ ...pagination, page: 1 })
                }}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label>Commodity</Label>
                <Select
                  value={filters.commodityId}
                  onValueChange={(value) => {
                    setFilters({ ...filters, commodityId: value === "all" ? "" : value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All commodities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All commodities</SelectItem>
                    {commodities.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => {
                    setFilters({ ...filters, status: value === "all" ? "" : value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters({ ...filters, startDate: e.target.value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters({ ...filters, endDate: e.target.value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bills table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bills List
          </CardTitle>
          <CardDescription>{pagination.total} total bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Seller</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Buyer</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Commodity</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Weight</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Rate/100kg</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Final Payable</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(10)].map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : bills.length > 0 ? (
                  bills.map((bill) => (
                    <tr key={bill._id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{bill.invoiceId}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(bill.createdAt)}</td>
                      <td className="py-3 px-4">{bill.sellerName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{bill.buyerName}</td>
                      <td className="py-3 px-4">{bill.commodityName}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatWeight(bill.adjustedTotalWeight)}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(bill.ratePer100Kg)}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(bill.finalPayable)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            bill.status === "paid"
                              ? "bg-success/10 text-success"
                              : bill.status === "finalized"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleViewBill(bill)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      No bills found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bills
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill detail dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details - {selectedBill?.invoiceId}</DialogTitle>
            <DialogDescription>Created on {selectedBill && formatDate(selectedBill.createdAt)}</DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-6">
              {/* Basic info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Seller</p>
                  <p className="font-medium">{selectedBill.sellerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                  <p className="font-medium">{selectedBill.buyerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commodity</p>
                  <p className="font-medium">{selectedBill.commodityName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedBill.status === "paid"
                        ? "bg-success/10 text-success"
                        : selectedBill.status === "finalized"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {selectedBill.status}
                  </span>
                </div>
              </div>

              {/* Billing settings */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3">Billing Settings</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rate per 100kg</p>
                    <p className="font-medium">{formatCurrency(selectedBill.ratePer100Kg)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deduction per Bag</p>
                    <p className="font-medium">{selectedBill.deductionPerBag} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Bags</p>
                    <p className="font-medium">{selectedBill.bagsCount}</p>
                  </div>
                </div>
              </div>

              {/* Bags table */}
              <div>
                <h4 className="font-medium mb-3">Bags Detail</h4>
                <div className="relative overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-2 px-3 font-medium">Bag #</th>
                        <th className="text-right py-2 px-3 font-medium">Original Weight</th>
                        <th className="text-right py-2 px-3 font-medium">Adjusted Weight</th>
                        <th className="text-right py-2 px-3 font-medium">Deduction</th>
                        <th className="text-left py-2 px-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBillBags.map((bag) => (
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
                        <td className="py-2 px-3 text-right font-mono">
                          {formatWeight(selectedBill.originalTotalWeight)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatWeight(selectedBill.adjustedTotalWeight)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                          -{formatWeight(selectedBill.originalTotalWeight - selectedBill.adjustedTotalWeight)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Amount breakdown */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3">Amount Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      Total Amount ({formatWeight(selectedBill.adjustedTotalWeight)} @{" "}
                      {formatCurrency(selectedBill.ratePer100Kg)}/100kg)
                    </span>
                    <span className="font-mono">{formatCurrency(selectedBill.totalAmount)}</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground mb-2">Deductions:</p>
                    <div className="space-y-1 pl-4">
                      <div className="flex justify-between">
                        <span>
                          Commission (
                          {selectedBill.deductions.commissionType === "percentage"
                            ? `${selectedBill.deductions.commission}%`
                            : "Flat"}
                          )
                        </span>
                        <span className="font-mono text-muted-foreground">
                          -
                          {formatCurrency(
                            selectedBill.deductions.commissionType === "percentage"
                              ? (selectedBill.totalAmount * selectedBill.deductions.commission) / 100
                              : selectedBill.deductions.commission,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transport</span>
                        <span className="font-mono text-muted-foreground">
                          -{formatCurrency(selectedBill.deductions.transport)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labour</span>
                        <span className="font-mono text-muted-foreground">
                          -{formatCurrency(selectedBill.deductions.labour)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loading</span>
                        <span className="font-mono text-muted-foreground">
                          -{formatCurrency(selectedBill.deductions.loading)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weighing</span>
                        <span className="font-mono text-muted-foreground">
                          -{formatCurrency(selectedBill.deductions.weighing)}
                        </span>
                      </div>
                      {selectedBill.deductions.misc > 0 && (
                        <div className="flex justify-between">
                          <span>Miscellaneous</span>
                          <span className="font-mono text-muted-foreground">
                            -{formatCurrency(selectedBill.deductions.misc)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border text-lg font-semibold">
                    <span>Final Payable</span>
                    <span className="text-primary">{formatCurrency(selectedBill.finalPayable)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
