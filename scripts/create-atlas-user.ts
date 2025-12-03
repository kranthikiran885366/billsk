// Create user in Atlas database (same as API routes)
import connectDB from '../backend/config/database.js'
import { UserService } from '../backend/services/index.js'
import { hashPassword } from '../lib/auth.js'

// Set environment variable for Atlas connection
process.env.MONGODB_URI = 'mongodb+srv://kranthi:Kranthi%409384@cluster0.nnyxzg0.mongodb.net/secure-billing-system?retryWrites=true&w=majority&appName=Cluster0'

async function createAtlasUser() {
  try {
    console.log('Using MongoDB URI:', process.env.MONGODB_URI?.substring(0, 50) + '...')
    
    await connectDB()
    
    const email = '231fa04a02@gmail.com'
    const password = '231fa04a02@gmail.com'
    
    // Check if user exists
    const existing = await UserService.findByEmail(email)
    if (existing) {
      console.log('✅ User already exists in Atlas database')
      return
    }
    
    // Create user
    const passwordHash = await hashPassword(password)
    const user = await UserService.create({
      email,
      name: 'Test User',
      role: 'admin',
      passwordHash,
      status: 'active',
      failedLoginAttempts: 0
    })
    
    console.log('✅ User created in Atlas database:')
    console.log(`   ID: ${user._id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createAtlasUser()