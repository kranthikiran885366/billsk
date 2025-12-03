import { Suspense } from "react"
import { AdminSettings } from "@/components/admin/admin-settings"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminSettings />
    </Suspense>
  )
}
