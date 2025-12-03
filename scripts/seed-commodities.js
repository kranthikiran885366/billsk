const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-billing-system';

const sampleCommodities = [
  {
    _id: 'comm_wheat_001',
    name: 'Wheat',
    defaultRatePer100Kg: 2500,
    defaultDeductionPerBag: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'comm_rice_001', 
    name: 'Rice',
    defaultRatePer100Kg: 3500,
    defaultDeductionPerBag: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'comm_corn_001',
    name: 'Corn',
    defaultRatePer100Kg: 2000,
    defaultDeductionPerBag: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedCommodities() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('commodities');
    
    // Clear existing commodities
    await collection.deleteMany({});
    
    // Insert sample commodities
    await collection.insertMany(sampleCommodities);
    
    console.log('Sample commodities seeded successfully!');
  } catch (error) {
    console.error('Error seeding commodities:', error);
  } finally {
    await client.close();
  }
}

seedCommodities();