// Script to create user
import connectDB from '../backend/config/database.js'
import { UserService } from '../backend/services/index.js'
import { hashPassword } from '../lib/auth.js'

async function createUser() {
  try {
    console.log('Connecting to MongoDB...')
    await connectDB()

    const email = '231fa04a02@gmail.com'
    const password = '231fa04a02@gmail.com'
    
    // Check if user exists
    const existingUser = await UserService.findByEmail(email)
    if (existingUser) {
      console.log('✅ User already exists')
      process.exit(0)
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const userData = {
      email,
      name: 'Test User',
      role: 'admin',
      passwordHash,
      status: 'active',
      failedLoginAttempts: 0
    }

    const user = await UserService.create(userData)
    console.log('✅ User created successfully:')
    console.log(`   ID: ${user._id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createUser()