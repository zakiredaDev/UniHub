// Import system parts
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB, closeDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import addChatSocket from './sockets/chatSocket.js';
import dotenv from 'dotenv';
import { profileDir } from './middlewares/profileUpload.js';

dotenv.config();

// Create express server
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const port = process.env.PORT || 4000;

// Allow to app core only
app.use(cors());
app.use(express.json());
app.use('/uploads/profiles', express.static(profileDir));
app.use((req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return sendJson(data);
  };
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/files', fileRoutes);
addChatSocket(io);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
  if (error) return res.status(400).json({ message: 'حصلت مشكلة في الطلب. راجع البيانات وحاول تاني.' });
  return next();
});

async function startServer() {
  await connectDB();
  await new Promise((resolve, reject) => {
    const handleListenError = (error) => reject(error);
    server.once('error', handleListenError);
    server.listen(port,"0.0.0.0", () => {
      server.off('error', handleListenError);
      resolve();
    });
  });
  console.log(`UniHub server is running on port ${port}`);
}

startServer().catch((error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`المنفذ ${port} مستخدم بالفعل. اقفل نسخة السيرفر القديمة أو غيّر قيمة PORT.`);
  } else {
    console.error(`Server failed to start: ${error.message}`);
  }
  closeDB().catch(() => {});
  process.exitCode = 1;
});
