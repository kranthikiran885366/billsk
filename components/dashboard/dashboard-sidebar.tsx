"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Package, Settings, Users, History, Shield, BarChart3, UserPlus } from "lucide-react"
import type { UserRole } from "@/lib/types"

interface DashboardSidebarProps {
  userRole: UserRole
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

const viewerNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Bills",
    href: "/dashboard/bills",
    icon: FileText,
  },
  {
    title: "Commodities",
    href: "/dashboard/commodities",
    icon: Package,
  },
]

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Bills",
    href: "/admin/bills",
    icon: FileText,
  },
  {
    title: "Multi-Farmer Bills",
    href: "/admin/bills/multi-farmer",
    icon: UserPlus,
  },
  {
    title: "Commodities",
    href: "/admin/commodities",
    icon: Package,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function DashboardSidebar({ userRole, isOpen, onClose, isMobile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const navItems = userRole === "admin" ? adminNavItems : viewerNavItems

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground transition-transform duration-300",
        isMobile 
          ? cn(
              "fixed left-0 top-0 z-50 w-64 border-r border-sidebar-border",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )
          : "fixed left-0 top-0 z-30 hidden lg:flex w-64 border-r border-sidebar-border",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent">
          <Shield className="h-5 w-5 text-sidebar-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Commodity Billing</span>
          <span className="text-xs text-sidebar-foreground/60 capitalize">{userRole} Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50">v1.0.0 - Secure System</p>
      </div>
    </aside>
  )
}
