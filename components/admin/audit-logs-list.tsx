"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { History, ChevronLeft, ChevronRight, Filter, Eye } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import type { AuditLog } from "@/lib/types"

export function AuditLogsList() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState({
    entityType: "",
    action: "",
    startDate: "",
    endDate: "",
  })

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.entityType) params.set("entityType", filters.entityType)
      if (filters.action) params.set("action", filters.action)
      if (filters.startDate) params.set("startDate", filters.startDate)
      if (filters.endDate) params.set("endDate", filters.endDate)

      const res = await fetch(`/api/audit-logs?${params}`)
      const data = await res.json()

      if (data.success) {
        setLogs(data.data.logs)
        setPagination((prev) => ({
          ...prev,
          total: data.data.total,
          totalPages: Math.ceil(data.data.total / prev.limit),
        }))
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "create":
        return "bg-success/10 text-success"
      case "update":
        return "bg-primary/10 text-primary"
      case "delete":
        return "bg-destructive/10 text-destructive"
      case "login":
        return "bg-accent/10 text-accent-foreground"
      case "logout":
        return "bg-muted text-muted-foreground"
      case "failed_login":
        return "bg-warning/10 text-warning"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Track all system activities and changes</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{pagination.total} log entries</p>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select
                  value={filters.entityType}
                  onValueChange={(value) => {
                    setFilters({ ...filters, entityType: value === "all" ? "" : value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="bill">Bill</SelectItem>
                    <SelectItem value="commodity">Commodity</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => {
                    setFilters({ ...filters, action: value === "all" ? "" : value })
                    setPagination({ ...pagination, page: 1 })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="failed_login">Failed Login</SelectItem>
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

      {/* Logs table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>Complete audit trail of all system operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entity</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entity ID</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">{log.userName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeClass(log.action)}`}
                        >
                          {log.action.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize">{log.entityType}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {log.entityId.slice(0, 12)}...
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No audit logs found
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
                Page {pagination.page} of {pagination.totalPages}
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

      {/* Log detail dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>{selectedLog && formatDateTime(selectedLog.timestamp)}</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeClass(selectedLog.action)}`}
                  >
                    {selectedLog.action.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity Type</p>
                  <p className="font-medium capitalize">{selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity ID</p>
                  <p className="font-mono text-xs">{selectedLog.entityId}</p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-muted-foreground">IP Address</p>
                    <p className="font-mono text-xs">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              {selectedLog.before && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Before</p>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">After</p>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
