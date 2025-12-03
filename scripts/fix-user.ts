// Fix user issue by creating the correct user in API database
import { UserService } from '../backend/services/index.js'
import { hashPassword } from '../lib/auth.js'

async function fixUser() {
  try {
    const targetEmail = '231fa04a02@gmail.com'
    const password = '231fa04a02@gmail.com'
    
    // Check existing user
    const existing = await UserService.findByEmail(targetEmail)
    if (existing) {
      console.log('✅ User already exists')
      return
    }
    
    // Create the user
    const passwordHash = await hashPassword(password)
    const user = await UserService.create({
      email: targetEmail,
      name: 'Test User',
      role: 'admin',
      passwordHash,
      status: 'active',
      failedLoginAttempts: 0
    })
    
    console.log('✅ User created:', user.email)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixUser()