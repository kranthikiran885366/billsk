import { Suspense } from "react"
import { AdminCommoditiesList } from "@/components/admin/admin-commodities-list"
import { Loader2 } from "lucide-react"

export default function AdminCommoditiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminCommoditiesList />
    </Suspense>
  )
}
