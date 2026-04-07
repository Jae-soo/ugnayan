import mongoose from 'mongoose';
import dns from 'dns';

// FIX: Force Google DNS to bypass local DNS issues (ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('✅ Applied DNS fix: Using Google DNS (8.8.8.8)');
} catch (e) {
  console.warn('⚠️ Failed to set custom DNS servers:', e);
}

let mongoUri: string | undefined = process.env.MONGODB_URI;

export function setMongoUri(uri: string): void {
  mongoUri = uri;
}

interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!mongoUri) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }
    
    console.log('🔄 Connecting to MongoDB...');
    
    const opts = { 
      bufferCommands: false,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to avoid some DNS resolution issues
      serverSelectionTimeoutMS: 15000, // Timeout after 15s instead of 30s
      heartbeatFrequencyMS: 10000,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch(err => {
      console.error('❌ MongoDB connection error details:', err);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
