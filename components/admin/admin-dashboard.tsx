"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Package, Users, TrendingUp, Clock, Plus, ArrowRight, BarChart3 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Bill } from "@/lib/types"

interface DashboardStats {
  totalBills: number
  totalRevenue: number
  pendingAmount: number
  totalCommodities: number
  recentBills: Bill[]
  billsByStatus: { status: string; count: number }[]
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats")
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Admin dashboard overview</p>
        </div>
        <Button asChild>
          <Link href="/admin/bills/new">
            <Plus className="mr-2 h-4 w-4" />
            New Bill
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBills || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/admin/bills" className="hover:underline">
                View all bills
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(stats?.pendingAmount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commodities</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCommodities || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/admin/commodities" className="hover:underline">
                Manage commodities
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions and recent bills */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/bills/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Bill
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/commodities">
                <Package className="mr-2 h-4 w-4" />
                Manage Commodities
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent bills */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bills</CardTitle>
              <CardDescription>Latest invoices created</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/bills">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentBills.map((bill) => (
                <div
                  key={bill._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{bill.invoiceId}</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          bill.status === "paid"
                            ? "bg-success/10 text-success"
                            : bill.status === "finalized"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted-foreground/10 text-muted-foreground"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {bill.sellerName} → {bill.buyerName}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium">{formatCurrency(bill.finalPayable)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(bill.createdAt)}</p>
                  </div>
                </div>
              ))}
              {(!stats?.recentBills || stats.recentBills.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No bills yet. Create your first bill to get started.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills by status */}
      <Card>
        <CardHeader>
          <CardTitle>Bills by Status</CardTitle>
          <CardDescription>Distribution of bill statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {stats?.billsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.status === "paid"
                        ? "bg-success"
                        : item.status === "finalized"
                          ? "bg-primary"
                          : "bg-muted-foreground"
                    }`}
                  />
                  <span className="capitalize font-medium">{item.status}</span>
                </div>
                <span className="text-2xl font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
