"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Search,
  FileText,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate, formatWeight } from "@/lib/format"
import type { Bill, Commodity } from "@/lib/types"

export function AdminBillsList() {
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
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
        setPagination((prev) => ({
          ...prev,
          total: data.data.total,
          totalPages: data.data.totalPages,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, filters])

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

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/bills/${deleteId}`, { method: "DELETE" })
      const data = await res.json()

      if (data.success) {
        toast.success("Bill deleted successfully")
        fetchBills()
      } else {
        toast.error(data.error?.message || "Failed to delete bill")
      }
    } catch {
      toast.error("Failed to delete bill")
    } finally {
      setDeleteId(null)
    }
  }

  const handleStatusChange = async (billId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Bill marked as ${newStatus}`)
        fetchBills()
      } else {
        toast.error(data.error?.message || "Failed to update status")
      }
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleExportCSV = () => {
    const headers = [
      "Invoice ID",
      "Date",
      "Seller",
      "Buyer",
      "Commodity",
      "Total Weight",
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
          <p className="text-muted-foreground">Manage commodity bills and invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/bills/new">
              <Plus className="mr-2 h-4 w-4" />
              New Bill
            </Link>
          </Button>
        </div>
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
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Commodity</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Weight</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Final Payable</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(8)].map((_, j) => (
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
                      <td className="py-3 px-4">{bill.commodityName}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatWeight(bill.adjustedTotalWeight)}</td>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/bills/${bill._id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/bills/${bill._id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {bill.status === "draft" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(bill._id, "finalized")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Finalized
                              </DropdownMenuItem>
                            )}
                            {bill.status === "finalized" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(bill._id, "paid")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(bill._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bill? This action cannot be undone and will also delete all
              associated bag records.
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
