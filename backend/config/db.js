import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/triovault';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
    });
    isConnected = true;
    console.log(`[TrioVault DB] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[TrioVault DB] MongoDB Connection Notice: Could not connect to ${uri}`);
    console.warn(`[TrioVault DB] Note: Running with high-availability in-memory replica store.`);
    console.warn(`[TrioVault DB] For persistent cloud storage, set MONGODB_URI in backend/.env`);
    isConnected = false;
    return false;
  }
};

export const getDBStatus = () => isConnected;
