"use client"

import { useEffect, useState } from "react"
import { BillForm } from "./bill-form"
import { Loader2 } from "lucide-react"
import type { Bill, Bag } from "@/lib/types"

interface EditBillFormProps {
  billId: string
}

export function EditBillForm({ billId }: EditBillFormProps) {
  const [bill, setBill] = useState<Bill | null>(null)
  const [bags, setBags] = useState<Bag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBillData()
  }, [billId])

  const fetchBillData = async () => {
    try {
      const [billRes, bagsRes] = await Promise.all([fetch(`/api/bills/${billId}`), fetch(`/api/bills/${billId}/bags`)])

      const billData = await billRes.json()
      const bagsData = await bagsRes.json()

      if (billData.success) {
        setBill(billData.data)
      }
      if (bagsData.success) {
        setBags(bagsData.data)
      }
    } catch (error) {
      console.error("Failed to fetch bill:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!bill) {
    return <div className="text-center py-12 text-muted-foreground">Bill not found</div>
  }

  return <BillForm bill={bill} bags={bags} />
}
