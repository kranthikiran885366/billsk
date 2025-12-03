import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { MultiFarmerBillForm } from "@/components/admin/multi-farmer-bill-form"

export default function MultiFarmerBillPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/bills">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Multi-Farmer Bill</h1>
          <p className="text-muted-foreground">Create a bill with multiple farmers for one buyer</p>
        </div>
      </div>
      <MultiFarmerBillForm />
    </div>
  )
}