import { Suspense } from "react"
import { CommoditiesListViewer } from "@/components/dashboard/commodities-list-viewer"
import { Loader2 } from "lucide-react"

export default function CommoditiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CommoditiesListViewer />
    </Suspense>
  )
}
