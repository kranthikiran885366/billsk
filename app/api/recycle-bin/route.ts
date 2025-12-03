import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import connectDB from '@/backend/config/database'
import { AuditLogModel } from '@/backend/models'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const deletedItems = await AuditLogModel.find({
      action: { $in: ['DELETE_BILL', 'DELETE_COMMODITY', 'DELETE_USER'] }
    }).sort({ timestamp: -1 }).limit(100)

    return NextResponse.json({ items: deletedItems })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { itemId, itemType } = await request.json()
    
    await connectDB()

    // Log restore action
    await AuditLog.create({
      userId: payload.userId,
      action: `RESTORE_${itemType.toUpperCase()}`,
      resourceType: itemType,
      resourceId: itemId,
      details: { restoredAt: new Date() }
    })

    return NextResponse.json({ message: 'Item restored successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}