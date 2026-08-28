import mongoose from 'mongoose'

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
  if (cached.conn && cached.conn.connection && cached.conn.connection.readyState === 1) {
    return cached.conn
  }

  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set.')
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    }).then(m => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
