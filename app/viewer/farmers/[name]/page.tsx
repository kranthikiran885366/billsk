import { ViewerFarmerDetail } from "@/components/viewer/viewer-farmer-detail"

interface PageProps {
  params: Promise<{ name: string }>
}

export default async function ViewerFarmerDetailPage({ params }: PageProps) {
  const { name } = await params
  return <ViewerFarmerDetail farmerName={decodeURIComponent(name)} />
}