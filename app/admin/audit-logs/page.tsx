import { Suspense } from "react"
import { AuditLogsList } from "@/components/admin/audit-logs-list"
import { Loader2 } from "lucide-react"

export default function AuditLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuditLogsList />
    </Suspense>
  )
}
