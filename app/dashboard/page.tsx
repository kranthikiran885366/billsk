import { Suspense } from "react"
import { ViewerDashboard } from "@/components/dashboard/viewer-dashboard"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ViewerDashboard />
    </Suspense>
  )
}
