const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const mongoUri = process.env.MONGO_URI;

let connectionPromise = null;

function connectMongo() {
  if (connectionPromise) return connectionPromise;
  if (!mongoUri) {
    const err = new Error('MONGO_URI is not set');
    console.error('❌ MongoDB connection failed: MONGO_URI is not set');
    connectionPromise = Promise.reject(err);
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  })
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
      throw err;
    });

  return connectionPromise;
}

connectMongo();

module.exports = mongoose;
module.exports.connectMongo = connectMongo;
