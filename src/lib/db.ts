import mongoose from 'mongoose'
import dns from 'node:dns'

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

// `mongodb+srv` requires Node's DNS resolver to query SRV records. Some local
// Windows setups expose only a loopback DNS address even when no resolver is
// listening there, which makes Mongoose fail with `querySrv ECONNREFUSED`.
const configuredDnsServers = dns.getServers()
if (
  configuredDnsServers.length === 0 ||
  configuredDnsServers.every(server => server === '127.0.0.1' || server === '::1')
) {
  dns.setServers(['1.1.1.1', '8.8.8.8'])
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
