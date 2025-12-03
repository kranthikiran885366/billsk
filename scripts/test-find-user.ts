// Debug script to test findUserByEmail
import connectDB from '../backend/config/database.js'
import { findUserByEmail } from '../lib/db.js'

async function testFindUser() {
  try {
    await connectDB()
    
    const email = '231fa04a02@gmail.com'
    console.log(`Searching for user: ${email}`)
    
    const user = await findUserByEmail(email)
    
    if (user) {
      console.log('✅ User found via findUserByEmail:')
      console.log(JSON.stringify(user, null, 2))
    } else {
      console.log('❌ User NOT found via findUserByEmail')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testFindUser()
