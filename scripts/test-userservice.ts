// Test UserService directly
import { UserService } from '../backend/services/index.js'

async function testUserService() {
  try {
    console.log('Testing UserService.findByEmail...')
    
    const email = '231fa04a02@gmail.com'
    console.log('Searching for:', email)
    
    const user = await UserService.findByEmail(email)
    
    if (user) {
      console.log('✅ UserService found user:')
      console.log(`   ID: ${user._id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
    } else {
      console.log('❌ UserService did not find user')
    }
    
    // Test with different variations
    console.log('\nTesting variations...')
    
    const variations = [
      email.toLowerCase(),
      email.toUpperCase(),
      email.trim(),
      ' ' + email + ' '
    ]
    
    for (const variation of variations) {
      console.log(`Testing: "${variation}"`)
      const result = await UserService.findByEmail(variation)
      console.log(`Result: ${result ? 'FOUND' : 'NOT FOUND'}`)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testUserService()