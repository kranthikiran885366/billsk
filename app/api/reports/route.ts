import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import connectDB from '@/backend/config/database'
import { BillModel, CommodityModel } from '@/backend/models'

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
    const type = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    await connectDB()

    let report = {}

    if (type === 'summary') {
      const totalBills = await BillModel.countDocuments()
      const totalCommodities = await CommodityModel.countDocuments()
      const totalRevenue = await BillModel.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])

      report = {
        totalBills,
        totalCommodities,
        totalRevenue: totalRevenue[0]?.total || 0,
        generatedAt: new Date()
      }
    }

    return NextResponse.json({ report })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}