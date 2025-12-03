const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const uri = 'mongodb+srv://kranthi:Kranthi%409384@cluster0.nnyxzg0.mongodb.net/secure-billing-system?retryWrites=true&w=majority&appName=Cluster0';

async function checkHash() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('secure-billing-system');
    const users = db.collection('users');
    
    const user = await users.findOne({ email: 'admin@example.com' });
    console.log('Current hash in DB:', user.passwordHash);
    
    // Test different passwords
    const passwords = ['password123', 'admin@example.com', 'admin', '123456'];
    
    for (const pwd of passwords) {
      const isValid = await bcrypt.compare(pwd, user.passwordHash);
      console.log(`Password "${pwd}":`, isValid ? 'VALID' : 'Invalid');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkHash();