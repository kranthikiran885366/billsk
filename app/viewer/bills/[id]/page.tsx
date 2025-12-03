import { ViewerBillDetail } from "@/components/viewer/viewer-bill-detail"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ViewerBillDetailPage({ params }: PageProps) {
  const { id } = await params
  return <ViewerBillDetail billId={id} />
}