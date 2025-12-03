// Script to check user and verify password
import connectDB from '../backend/config/database.js'
import { UserService } from '../backend/services/index.js'
import { hashPassword, verifyPassword } from '../lib/auth.js'

async function checkUser() {
  try {
    console.log('Connecting to MongoDB...')
    await connectDB()

    const email = '231fa04a02@gmail.com'
    
    // Find user
    const user = await UserService.findByEmail(email)
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    console.log('✅ User found:')
    console.log(`   ID: ${user._id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   Failed Attempts: ${user.failedLoginAttempts}`)
    console.log(`   Locked Until: ${user.lockedUntil || 'Not locked'}`)
    console.log(`   Password Hash: ${user.passwordHash.substring(0, 20)}...`)

    // Test password verification
    const testPassword = '231fa04a02@gmail.com'
    console.log(`\nTesting password: "${testPassword}"`)
    const isValid = await verifyPassword(testPassword, user.passwordHash)
    console.log(`Password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`)

    // Reset password if needed
    if (!isValid) {
      console.log('\n⚠️ Resetting password...')
      const newHash = await hashPassword(testPassword)
      await UserService.update(user._id, { 
        passwordHash: newHash,
        failedLoginAttempts: 0,
        lockedUntil: undefined
      })
      console.log('✅ Password reset successfully')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkUser()
