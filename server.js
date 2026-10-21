// Import system parts
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
/*
import { connectDB, closeDB, pingDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import addChatSocket from './sockets/chatSocket.js';
*/
import dotenv from 'dotenv';
/*
import { profileDir } from './middlewares/profileUpload.js';
*/

dotenv.config();

// Create express server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000
});
const port = process.env.PORT || 4000;

// Allow to app core only
app.use(cors());
app.use(express.json());
/*
app.use('/uploads/profiles', express.static(profileDir));

app.get('/', (req, res) => res.send('UniHub API is running'));
app.use((req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return sendJson(data);
  };
  next();
});

// نقطة فحص (حطها قبل الراوترات عشان تفضل ترد حتى لو راوتر علّق). بتفحص الداتابيز فعلياً
// آخر خطأ في الاتصال بالداتابيز (تشخيص مؤقت: بيظهر في /health عشان تشوف السبب من المتصفح)
let lastDbError = null;

app.get('/health', async (req, res) => {
  const uptime = Math.round(process.uptime());
  try {
    await Promise.race([
      pingDB(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('db timeout')), 3000))
    ]);
    res.json({ status: 'ok', db: 'up', uptime });
  } catch (error) {
    // TODO: شيل حقل dbError بعد ما تحل المشكلة
    res.status(503).json({ status: 'degraded', db: 'down', uptime, dbError: lastDbError || error.message });
  }
});

// لو أي طلب استنى أكتر من 25 ثانية من غير رد (مثلاً راوتر async وقع فيه خطأ)، نرد بخطأ بدل ما يفضل معلّق
app.use((req, res, next) => {
  res.setTimeout(25000, () => {
    if (!res.headersSent) res.status(503).json({ message: 'السيرفر اتأخر في الرد. جرّب تاني.' });
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/files', fileRoutes);
addChatSocket(io);

// Middleware
app.use((error, req, res, next) => {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    if (req.path.includes('/avatar')) return res.status(400).json({ message: 'حجم صورة البروفايل لازم يكون أقل من 5 ميجابايت.' });
    return res.status(400).json({ message: 'حجم الملف أكبر من 15 ميجابايت.' });
  }
  if (error?.message?.startsWith('اختار صورة')) {
    return res.status(400).json({ message: error.message });
  }
  if (error?.message?.includes('نوع الملف مش مدعوم')) {
    return res.status(400).json({ message: 'نوع الملف مش مدعوم. اختار PDF أو Word أو PowerPoint.' });
  }
  if (error) {
    console.error('[request error]', error);
    return res.status(400).json({ message: 'حصلت مشكلة في الطلب. راجع البيانات وحاول تاني.' });
  }
  return next();
});

// نتصل بالداتابيز في الخلفية ونفضل نعيد المحاولة لحد ما ننجح، من غير ما السيرفر يقع
async function connectDBInBackground() {
  while (true) {
    try {
      await connectDB(3, 5000);
      lastDbError = null;
      return;
    } catch (error) {
      lastDbError = `${error.name}: ${error.message}`;
      console.error(`[startup] MongoDB connect failed: ${error.message} — retrying in 15s`);
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  }
}

async function startServer() {
  // نفتح البورت الأول، عشان الاستضافة تشوف إن التطبيق شغال (مفيش NO_LIVE_PORT)
  await new Promise((resolve, reject) => {
    const handleListenError = (error) => reject(error);
    server.once('error', handleListenError);
    server.listen(port, '0.0.0.0', () => {
      server.off('error', handleListenError);
      resolve();
    });
  });
  console.log(`UniHub server is running on port ${port}`);
  connectDBInBackground(); // لو فشل، هتلاقي السبب في اللوج و /health هيرجّع 503
}

startServer().catch(async (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`المنفذ ${port} مستخدم بالفعل. اقفل نسخة السيرفر القديمة أو غيّر قيمة PORT.`);
  } else {
    console.error(`Server failed to start: ${error.message}`);
  }
  try { await closeDB(); } catch (closeError) { }

  process.exit(1);
});

*/

server.listen(port, '0.0.0.0');