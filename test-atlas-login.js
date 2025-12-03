const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = 'mongodb+srv://kranthi:Kranthi%409384@cluster0.nnyxzg0.mongodb.net/secure-billing-system?retryWrites=true&w=majority&appName=Cluster0';

async function testLogin() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('secure-billing-system');
    const users = db.collection('users');
    
    // Test user lookup
    const user = await users.findOne({ email: 'admin@example.com' });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      // Test password verification
      const testPassword = 'password123';
      const isValid = await bcrypt.compare(testPassword, user.passwordHash);
      console.log('Password valid:', isValid ? 'Yes' : 'No');
      console.log('User role:', user.role);
      console.log('User status:', user.status);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

testLogin();