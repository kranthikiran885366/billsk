import { NextRequest, NextResponse } from "next/server"
import { BackupService } from "@/backend/services/backup"
import { verifyAuth } from "@/lib/auth"
import connectDB from "@/backend/config/database"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.success || auth.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } }, { status: 401 })
    }

    await connectDB()
    const backups = await BackupService.getBackupHistory()
    
    return NextResponse.json({ success: true, data: backups })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch backups' } 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.success || auth.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } }, { status: 401 })
    }

    const { type = 'full' } = await request.json()
    
    await connectDB()
    const backup = await BackupService.createBackup(type, auth.user.userId)
    
    return NextResponse.json({ success: true, data: backup })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create backup' } 
    }, { status: 500 })
  }
}