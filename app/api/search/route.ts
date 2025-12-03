import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import connectDB from '@/backend/config/database'
import { Bill, Commodity, User } from '@/backend/models'

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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 })
    }

    await connectDB()

    const results: any = {}

    if (type === 'all' || type === 'bills') {
      results.bills = await Bill.find({
        $or: [
          { billNumber: { $regex: query, $options: 'i' } },
          { customerName: { $regex: query, $options: 'i' } }
        ]
      }).limit(10)
    }

    if (type === 'all' || type === 'commodities') {
      results.commodities = await Commodity.find({
        name: { $regex: query, $options: 'i' }
      }).limit(10)
    }

    if ((type === 'all' || type === 'users') && payload.role === 'admin') {
      results.users = await User.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }).select('-passwordHash').limit(10)
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}