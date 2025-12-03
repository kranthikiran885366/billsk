"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Database, Loader2, Play, CheckCircle2, Clock, AlertCircle, HardDrive } from "lucide-react"
import type { BackupMeta } from "@/lib/types"

export function AdminBackups() {
  const [backups, setBackups] = useState<BackupMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTriggering, setIsTriggering] = useState(false)

  useEffect(() => {
    fetchBackups()
  }, [])

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/backups")
      const data = await res.json()
      if (data.success) {
        setBackups(data.data.backups)
      }
    } catch (error) {
      console.error("Failed to fetch backups:", error)
      toast.error("Failed to load backups")
    } finally {
      setIsLoading(false)
    }
  }

  const triggerBackup = async () => {
    setIsTriggering(true)
    try {
      const res = await fetch("/api/backups", { method: "POST" })
      const data = await res.json()

      if (data.success) {
        toast.success("Backup triggered successfully")
        setBackups((prev) => [data.data, ...prev])
      } else {
        toast.error(data.error?.message || "Failed to trigger backup")
      }
    } catch {
      toast.error("An error occurred while triggering backup")
    } finally {
      setIsTriggering(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "N/A"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const getStatusBadge = (status: BackupMeta["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> In Progress
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enterprise Backup System</h1>
          <p className="text-muted-foreground">Zero data loss backup with advanced recovery & replication</p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isTriggering}>
                {isTriggering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Full Backup
              </Button>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Trigger Manual Backup</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a full database backup. The process may take several minutes depending on the database
                size.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={triggerBackup}>Start Backup</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            variant="outline" 
            onClick={() => triggerIncrementalBackup()} 
            disabled={isTriggering}
          >
            Incremental
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={() => verifyAllBackups()} 
            disabled={isTriggering}
          >
            Verify All
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.filter((b) => b.verified).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Full Backups</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.filter((b) => b.type === "full").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Latest Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {backups.length > 0 ? formatDate(backups[0].timestamp) : "No backups"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backups table */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>All database backups with verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Backup ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Retention Until</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No backups found
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup._id}>
                    <TableCell className="font-mono text-sm">{backup.backupId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {backup.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(backup.timestamp)}</TableCell>
                    <TableCell>{formatBytes(backup.sizeBytes)}</TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>
                      {backup.verified ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell>{formatDate(backup.retentionUntil)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DR info */}
      <Card>
        <CardHeader>
          <CardTitle>Disaster Recovery Info</CardTitle>
          <CardDescription>Recovery objectives and restore procedures</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">RTO (Recovery Time Objective)</h4>
              <p className="text-2xl font-bold text-primary">60 minutes</p>
              <p className="text-sm text-muted-foreground mt-1">Maximum acceptable downtime for critical restores</p>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">RPO (Recovery Point Objective)</h4>
              <p className="text-2xl font-bold text-primary">10 minutes</p>
              <p className="text-sm text-muted-foreground mt-1">
                Maximum acceptable data loss via oplog/continuous backup
              </p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Restore Procedure</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Identify the target restore point (timestamp or backup ID)</li>
              <li>Stop all write operations to the database</li>
              <li>Restore from the latest full backup before target point</li>
              <li>Apply incremental/oplog entries up to target timestamp</li>
              <li>Verify record counts and checksums</li>
              <li>Resume application traffic</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
