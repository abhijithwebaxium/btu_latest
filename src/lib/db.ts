import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://abhijithsd_db_user:xZkEpNyz2YNvVzZw@cluster0.xxtejas.mongodb.net/'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = globalThis.mongooseCache || { conn: null, promise: null }
if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  const uri = process.env.MONGO_URI || MONGO_URI
  if (!uri) {
    throw new Error('MONGO_URI is missing in .env file')
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then(m => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
