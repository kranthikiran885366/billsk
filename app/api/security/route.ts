import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import connectDB from '@/backend/config/database'
import { SecurityLog } from '@/backend/models'

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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let filter = {}
    if (type !== 'all') {
      filter = { action: type.toUpperCase() }
    }

    const logs = await SecurityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('userId', 'name email')

    const stats = await SecurityLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ])

    return NextResponse.json({ logs, stats })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}