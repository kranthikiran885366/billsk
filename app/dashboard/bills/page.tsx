import { Suspense } from "react"
import { BillsListViewer } from "@/components/dashboard/bills-list-viewer"
import { Loader2 } from "lucide-react"

export default function BillsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillsListViewer />
    </Suspense>
  )
}
