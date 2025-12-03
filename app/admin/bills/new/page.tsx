import { BillForm } from "@/components/admin/bill-form"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewBillPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/bills">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Single Farmer Bill</h1>
          <p className="text-muted-foreground">Add a new commodity billing invoice for one farmer</p>
        </div>
      </div>
      <BillForm />
    </div>
  )
}
