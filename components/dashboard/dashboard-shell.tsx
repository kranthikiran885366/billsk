"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { DashboardHeader } from "./dashboard-header"
import { DashboardSidebar } from "./dashboard-sidebar"
import { Loader2, Menu } from "lucide-react"
import { useResponsive } from "@/lib/hooks/use-responsive"
import { Button } from "@/components/ui/button"
import type { UserRole } from "@/lib/types"

interface DashboardShellProps {
  children: React.ReactNode
  userRole: UserRole
}

export function DashboardShell({ children, userRole }: DashboardShellProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated, user } = useAuth()
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {(isMobile || isTablet) && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <DashboardSidebar 
        userRole={user?.role || userRole} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile || isTablet}
      />
      
      <div className={isDesktop ? "lg:pl-64" : ""}>
        {/* Mobile header with menu button */}
        {(isMobile || isTablet) && (
          <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Secure Billing</h1>
          </div>
        )}
        
        {isDesktop && <DashboardHeader />}
        
        <main className={`${isMobile ? "p-4" : isTablet ? "p-5" : "p-6"}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
