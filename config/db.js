import { MongoClient } from 'mongodb';

let client;
let database;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectOnce(mongoUri) {
  client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 10000, // بدل 30 ثانية: نفشل بسرعة بدل ما الطلبات تعلّق
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    maxIdleTimeMS: 60000 // نقفل الاتصالات الخاملة قبل ما الاستضافة/الـ proxy تقطعها
  });
  client.on('serverHeartbeatFailed', (event) => {
    console.error('[mongo] heartbeat failed:', event.failure?.message || event.failure);
  });
  await client.connect();
  database = client.db();
}

// Create connect with db (مع إعادة محاولة، لأن الشبكة على الاستضافات المجانية بتكون بطيئة وقت التشغيل)
async function connectDB(retries = 5, delayMs = 5000) {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not set. ضيفه في متغيرات البيئة.');

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await connectOnce(mongoUri);
      console.log('MongoDB connected');
      return;
    } catch (error) {
      lastError = error;
      console.error(`[mongo] connect attempt ${attempt}/${retries} failed: ${error.message}`);
      try { await client?.close(); } catch (closeError) { /* ignore */ }
      client = undefined;
      database = undefined;
      if (attempt < retries) await wait(delayMs);
    }
  }
  throw lastError;
}

function getDB() {
  if (!database) throw new Error('MongoDB is not connected.');
  return database;
}

// فحص حقيقي إن الداتابيز بترد (بيُستخدم في /health)
async function pingDB() {
  if (!database) throw new Error('MongoDB is not connected.');
  await database.command({ ping: 1 });
}

async function closeDB() {
  if (!client) return;
  await client.close();
  client = undefined;
  database = undefined;
}

export { connectDB, getDB, closeDB, pingDB };
