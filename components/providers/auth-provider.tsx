"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User, UserRole } from "@/lib/types"

interface AuthState {
  user: Pick<User, "_id" | "name" | "email" | "role"> | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  hasRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session")
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data?.user) {
          setState({
            user: data.data.user,
            isLoading: false,
            isAuthenticated: true,
          })
          return
        }
      }
    } catch {
      // Session check failed
    }
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.success && data.data?.user) {
        setState({
          user: data.data.user,
          isLoading: false,
          isAuthenticated: true,
        })
        return { success: true }
      }

      return {
        success: false,
        error: data.error?.message || "Login failed",
      }
    } catch {
      return { success: false, error: "Network error. Please try again." }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Logout request failed, but we still clear local state
    }
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
    router.push("/login")
  }, [router])

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          await checkSession()
          return true
        }
      }
    } catch {
      // Refresh failed
    }
    return false
  }, [])

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!state.user) return false
      return roles.includes(state.user.role)
    },
    [state.user],
  )

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshSession,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
