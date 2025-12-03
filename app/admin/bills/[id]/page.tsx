import { Suspense } from "react"
import { BillDetail } from "@/components/admin/bill-detail"
import { Loader2 } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BillDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillDetail billId={id} />
    </Suspense>
  )
}
