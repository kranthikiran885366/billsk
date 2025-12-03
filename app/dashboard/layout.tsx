import type React from "react"
import { AuthProvider } from "@/components/providers/auth-provider"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardShell userRole="viewer">{children}</DashboardShell>
    </AuthProvider>
  )
}
