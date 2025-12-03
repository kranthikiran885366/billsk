import { ViewerBillDetail } from "@/components/viewer/viewer-bill-detail"

export default function ViewerBillDetailPage({ params }: { params: { id: string } }) {
  return <ViewerBillDetail billId={params.id} />
}