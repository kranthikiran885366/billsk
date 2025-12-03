import { Suspense } from "react"
import { EditBillForm } from "@/components/admin/edit-bill-form"
import { Loader2 } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditBillPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Bill</h1>
        <p className="text-muted-foreground">Update bill details and recalculate amounts</p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <EditBillForm billId={id} />
      </Suspense>
    </div>
  )
}
