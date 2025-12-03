// Script to add a new user to the database
import connectDB from '../backend/config/database.js'
import { UserService } from '../backend/services/index.js'
import { hashPassword } from '../lib/auth.js'

async function addUser() {
  try {
    console.log('Connecting to MongoDB...')
    await connectDB()

    const email = '231fa04a02@gmail.com'
    const password = '231fa04a02@gmail.com' // Using email as password as requested
    const name = 'User 231fa04a02'
    const role = 'admin' // Change to 'viewer' if needed

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email)
    if (existingUser) {
      console.log(`❌ User with email ${email} already exists`)
      process.exit(1)
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create the user
    const newUser = await UserService.create({
      email,
      passwordHash: hashedPassword,
      name,
      role,
      status: 'active',
      mfaEnabled: false,
      failedLoginAttempts: 0,
    })

    console.log('✅ User created successfully:')
    console.log(`   Email: ${newUser.email}`)
    console.log(`   Name: ${newUser.name}`)
    console.log(`   Role: ${newUser.role}`)
    console.log(`   Password: ${password}`)
    console.log('\nYou can now login with these credentials.')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding user:', error)
    process.exit(1)
  }
}

addUser()
