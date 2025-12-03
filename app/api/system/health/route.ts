import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import connectDB from '@/backend/config/database'
import mongoose from 'mongoose'

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

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      database: {
        connected: mongoose.connection.readyState === 1,
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      uptime: Math.round(process.uptime())
    }

    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      error: 'Health check failed' 
    }, { status: 500 })
  }
}