// Test login API endpoint directly
import { findUserByEmail } from '../lib/db.js'
import { verifyPassword } from '../lib/auth.js'

async function testLogin() {
  try {
    const email = '231fa04a02@gmail.com'
    const password = '231fa04a02@gmail.com'
    
    console.log('Testing login for:', email)
    
    // Test findUserByEmail from lib/db
    console.log('\n1. Testing findUserByEmail from lib/db...')
    const user = await findUserByEmail(email)
    
    if (!user) {
      console.log('❌ User not found via lib/db')
      return
    }
    
    console.log('✅ User found via lib/db:')
    console.log(`   ID: ${user._id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   Failed Attempts: ${user.failedLoginAttempts}`)
    console.log(`   Locked Until: ${user.lockedUntil || 'Not locked'}`)
    
    // Test password verification
    console.log('\n2. Testing password verification...')
    const isValid = await verifyPassword(password, user.passwordHash)
    console.log(`Password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
    
    if (!isValid) {
      console.log('❌ Password verification failed')
      return
    }
    
    console.log('\n✅ All tests passed - login should work')
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testLogin()