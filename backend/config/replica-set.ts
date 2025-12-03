import mongoose from "mongoose"

const REPLICA_SET_URI = process.env.MONGODB_REPLICA_URI || "mongodb://localhost:27017,localhost:27018,localhost:27019/secure-billing-system?replicaSet=rs0"

interface ReplicaSetConfig {
  primary: string
  secondaries: string[]
  readPreference: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest'
  writeConcern: { w: number | 'majority'; j: boolean; wtimeout: number }
}

const replicaConfig: ReplicaSetConfig = {
  primary: process.env.MONGODB_PRIMARY || "localhost:27017",
  secondaries: process.env.MONGODB_SECONDARIES?.split(',') || ["localhost:27018", "localhost:27019"],
  readPreference: 'primaryPreferred',
  writeConcern: { w: 'majority', j: true, wtimeout: 5000 }
}

export async function connectWithReplicaSet(): Promise<typeof mongoose> {
  const options = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    replicaSet: 'rs0',
    readPreference: replicaConfig.readPreference,
    writeConcern: replicaConfig.writeConcern,
    retryWrites: true,
    retryReads: true,
  }

  try {
    const connection = await mongoose.connect(REPLICA_SET_URI, options)
    console.log("✅ MongoDB Replica Set connected successfully")
    
    // Monitor replica set status
    await monitorReplicaSetHealth()
    
    return connection
  } catch (error) {
    console.error("❌ MongoDB Replica Set connection failed:", error)
    throw error
  }
}

async function monitorReplicaSetHealth(): Promise<void> {
  try {
    const admin = mongoose.connection.db.admin()
    const status = await admin.command({ replSetGetStatus: 1 })
    
    console.log("📊 Replica Set Status:")
    status.members.forEach((member: any) => {
      console.log(`  - ${member.name}: ${member.stateStr} (health: ${member.health})`)
    })
  } catch (error) {
    console.warn("⚠️ Could not get replica set status:", error)
  }
}

export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession()
  
  try {
    return await session.withTransaction(async () => {
      return await operation(session)
    }, {
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority', j: true }
    })
  } finally {
    await session.endSession()
  }
}

export { replicaConfig }