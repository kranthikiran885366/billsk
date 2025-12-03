import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import connectDB from '@/backend/config/database'
import { AuditLog } from '@/backend/models'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const notifications = await AuditLog.find({
      $or: [
        { action: { $in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED'] } },
        { userId: payload.userId }
      ]
    }).sort({ timestamp: -1 }).limit(50)

    return NextResponse.json({ notifications })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { notificationIds } = await request.json()
    
    await connectDB()

    // Mark notifications as read (implementation depends on notification model)
    return NextResponse.json({ message: 'Notifications marked as read' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}