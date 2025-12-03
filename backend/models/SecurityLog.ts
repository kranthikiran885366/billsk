import mongoose from 'mongoose'

const securityLogSchema = new mongoose.Schema({
  userId: { type: String, default: null }, // Changed from ObjectId to String to allow "unknown"
  ip: { type: String, required: true },
  userAgent: String,
  action: { 
    type: String, 
    required: true,
    enum: ['LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'RATE_LIMITED']
  },
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed
})

export const SecurityLog = mongoose.models.SecurityLog || mongoose.model('SecurityLog', securityLogSchema)