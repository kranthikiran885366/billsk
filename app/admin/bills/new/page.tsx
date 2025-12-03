import { BillForm } from "@/components/admin/bill-form"

export default function NewBillPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create New Bill</h1>
        <p className="text-muted-foreground">Add a new commodity billing invoice</p>
      </div>
      <BillForm />
    </div>
  )
}
