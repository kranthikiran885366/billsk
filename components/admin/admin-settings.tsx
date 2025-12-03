"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Settings, Loader2, Shield, Database, Clock, Save, CheckCircle2 } from "lucide-react"
import type { Settings as SettingsType } from "@/lib/types"

export function AdminSettings() {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deductionPerBagDefault: settings.deductionPerBagDefault,
          roundingMode: settings.roundingMode,
          defaultRatePer100Kg: settings.defaultRatePer100Kg,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Settings saved successfully")
        setSettings(data.data)
      } else {
        toast.error(data.error?.message || "Failed to save settings")
      }
    } catch {
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!settings) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load settings</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure system defaults and policies</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Billing defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Billing Defaults
            </CardTitle>
            <CardDescription>Default values for new bills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultRate">Default Rate per 100kg</Label>
              <Input
                id="defaultRate"
                type="number"
                step="0.01"
                min="0"
                value={settings.defaultRatePer100Kg}
                onChange={(e) =>
                  setSettings({ ...settings, defaultRatePer100Kg: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deduction">Default Bag Deduction</Label>
              <Select
                value={settings.deductionPerBagDefault.toString()}
                onValueChange={(v) =>
                  setSettings({ ...settings, deductionPerBagDefault: Number.parseInt(v) as 0 | 1 | 2 })
                }
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

            <div className="space-y-2">
              <Label htmlFor="rounding">Rounding Mode</Label>
              <Select
                value={settings.roundingMode}
                onValueChange={(v) => setSettings({ ...settings, roundingMode: v as "floor" | "ceil" | "round" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round (Standard)</SelectItem>
                  <SelectItem value="floor">Floor (Round down)</SelectItem>
                  <SelectItem value="ceil">Ceiling (Round up)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Backup policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup Policy
            </CardTitle>
            <CardDescription>Data protection configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Full Backup</Label>
                <p className="font-medium">{settings.backupPolicy.fullBackupIntervalHours}h interval</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Incremental</Label>
                <p className="font-medium">{settings.backupPolicy.incrementalBackupIntervalMinutes}m interval</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Retention</Label>
                <p className="font-medium">{settings.backupPolicy.retentionDays} days</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Offsite Copies</Label>
                <p className="font-medium">{settings.backupPolicy.offsiteCopies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RTO/RPO targets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recovery Targets
            </CardTitle>
            <CardDescription>Disaster recovery objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">RTO</Label>
                <p className="font-medium">{settings.rtoMinutes} minutes</p>
                <p className="text-xs text-muted-foreground">Max downtime</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">RPO</Label>
                <p className="font-medium">{settings.rpoMinutes} minutes</p>
                <p className="text-xs text-muted-foreground">Max data loss</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Features
            </CardTitle>
            <CardDescription>Active security controls</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                JWT Authentication (15m expiry)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Bcrypt password hashing (cost 12)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Rate limiting (5 login attempts/15m)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Account lockout protection
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Role-based access control
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Immutable audit logging
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
