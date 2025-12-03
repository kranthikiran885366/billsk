// Create user in the API route's database context
import { UserService } from '../backend/services/index.js'
import { hashPassword } from '../lib/auth.js'

async function createAPIUser() {
  try {
    const email = '231fa04a02@gmail.com'
    const password = '231fa04a02@gmail.com'
    
    console.log('Creating user for API context...')
    
    // Check if user exists
    const existingUser = await UserService.findByEmail(email)
    if (existingUser) {
      console.log('✅ User already exists')
      return
    }
    
    // Create user
    const passwordHash = await hashPassword(password)
    const userData = {
      email,
      name: 'Test User',
      role: 'admin' as const,
      passwordHash,
      status: 'active' as const,
      failedLoginAttempts: 0
    }
    
    const user = await UserService.create(userData)
    console.log('✅ User created successfully:')
    console.log(`   ID: ${user._id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createAPIUser()