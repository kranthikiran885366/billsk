// Debug database connection and user collection
import connectDB from '../backend/config/database.js'
import { UserModel } from '../backend/models/index.js'
import mongoose from 'mongoose'

async function debugDatabase() {
  try {
    console.log('1. Connecting to MongoDB...')
    await connectDB()
    console.log('✅ Connected to:', mongoose.connection.db?.databaseName)
    
    console.log('\n2. Checking collections...')
    const collections = await mongoose.connection.db?.listCollections().toArray()
    console.log('Available collections:', collections?.map(c => c.name))
    
    console.log('\n3. Checking users collection...')
    const userCount = await UserModel.countDocuments()
    console.log('Total users in collection:', userCount)
    
    console.log('\n4. Finding all users...')
    const allUsers = await UserModel.find({}).lean()
    console.log('All users:')
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user._id})`)
    })
    
    console.log('\n5. Direct search for target email...')
    const targetEmail = '231fa04a02@gmail.com'
    const directUser = await UserModel.findOne({ email: targetEmail }).lean()
    console.log('Direct search result:', directUser ? 'FOUND' : 'NOT FOUND')
    
    if (directUser) {
      console.log('User details:', {
        id: directUser._id,
        email: directUser.email,
        name: directUser.name,
        status: directUser.status
      })
    }
    
    console.log('\n6. Case-insensitive search...')
    const caseInsensitiveUser = await UserModel.findOne({ 
      email: { $regex: new RegExp(`^${targetEmail}$`, 'i') } 
    }).lean()
    console.log('Case-insensitive result:', caseInsensitiveUser ? 'FOUND' : 'NOT FOUND')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

debugDatabase()