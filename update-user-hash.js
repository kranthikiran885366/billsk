const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://kranthi:Kranthi%409384@cluster0.nnyxzg0.mongodb.net/secure-billing-system?retryWrites=true&w=majority&appName=Cluster0';

async function updateHash() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('secure-billing-system');
    const users = db.collection('users');
    
    const newHash = '$2b$12$HPm0/D.V2/InFFLpaMNiB.iOcP8b4F/b3qePPyA9anzoBxu0x6p06';
    
    const result = await users.updateOne(
      { email: 'admin@example.com' },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    );
    
    console.log('Update result:', result.modifiedCount > 0 ? 'Success' : 'Failed');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

updateHash();