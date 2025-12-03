import { ViewerFarmerDetail } from "@/components/viewer/viewer-farmer-detail"

export default function ViewerFarmerDetailPage({ params }: { params: { name: string } }) {
  return <ViewerFarmerDetail farmerName={decodeURIComponent(params.name)} />
}