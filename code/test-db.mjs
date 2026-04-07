
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

// FIX: Force Google DNS to bypass local DNS issues (ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('✅ Applied DNS fix: Using Google DNS (8.8.8.8)');
} catch (e) {
  console.warn('⚠️ Failed to set custom DNS servers:', e);
}

// Load environment variables from .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
} catch (err) {
  console.error('Error reading .env.local:', err);
}

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  console.log('Attempting to connect to MongoDB...');
  console.log('URI:', MONGODB_URI.replace(/:([^@]+)@/, ':****@')); // Hide password

  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('✅ MongoDB connected successfully!');
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('paused')) {
      console.error('💡 The MongoDB Atlas cluster appears to be paused. Please resume it in the Atlas dashboard.');
    } else if (error.message.includes('IP')) {
      console.error('💡 This might be an IP whitelist issue. Ensure your current IP is allowed in Atlas.');
    } else if (error.message.includes('auth')) {
      console.error('💡 Authentication failed. Check your username and password.');
    }
  }
}

testConnection();
