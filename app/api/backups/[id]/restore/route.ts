import { NextRequest, NextResponse } from "next/server"
import { BackupService } from "@/backend/services/backup"
import { verifyAccessToken } from "@/lib/auth"
import connectDB from "@/backend/config/database"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.success || auth.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } }, { status: 401 })
    }

    await connectDB()
    await BackupService.restoreBackup(params.id, auth.user.userId)
    
    return NextResponse.json({ success: true, data: { message: 'Backup restored successfully' } })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to restore backup' } 
    }, { status: 500 })
  }
}