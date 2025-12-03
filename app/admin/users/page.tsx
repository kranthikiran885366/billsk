import { Suspense } from "react"
import { AdminUsersList } from "@/components/admin/admin-users-list"
import { Loader2 } from "lucide-react"

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminUsersList />
    </Suspense>
  )
}
