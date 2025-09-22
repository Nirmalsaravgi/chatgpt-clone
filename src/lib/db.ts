import { MongoClient, Db } from "mongodb"

let client: MongoClient | null = null
let dbInstance: Db | null = null
let indexesEnsured = false

const MONGODB_URI = process.env.MONGODB_URI || ""
const MONGODB_DB = process.env.MONGODB_DB || undefined

export async function getDb(): Promise<Db> {
  if (dbInstance) return dbInstance
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment")
  }
  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      // modern drivers handle pooling automatically; keep options minimal
      maxPoolSize: 10,
    })
    await client.connect()
  }
  dbInstance = client.db(MONGODB_DB)
  return dbInstance
}

export async function getCollections() {
  const db = await getDb()
  const threads = db.collection("threads")
  const messages = db.collection("messages")
  if (!indexesEnsured) {
    indexesEnsured = true
    // best-effort, do not block
    threads.createIndex({ userId: 1, updatedAt: -1 }).catch(() => {})
    threads.createIndex({ userId: 1, lastMessageAt: -1 }).catch(() => {})
    messages.createIndex({ threadId: 1, createdAt: 1 }).catch(() => {})
  }
  return { db, threads, messages }
}


