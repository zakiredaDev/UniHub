import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import protect from '../middlewares/authMiddleware.js';
import { getFiles, uploadFile, downloadFile } from '../controllers/fileController.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function decodeFileName(name) {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? name : decoded;
}

const storage = multer.diskStorage({
  destination: path.join(currentDir, '../uploads'),
  filename: (req, file, done) => {
    const extension = path.extname(decodeFileName(file.originalname)).replace(/[^a-zA-Z0-9.]/g, '');
    done(null, `${Date.now()}${extension}`);
  }
});

function checkFile(req, file, done) {
  const allowedTypes = /pdf|msword|officedocument|powerpoint/;
  const fileType = file.mimetype.toLowerCase();
  if (allowedTypes.test(fileType)) return done(null, true);
  return done(new Error('نوع الملف مش مدعوم. استخدم PDF أو Word أو PowerPoint.'));
}

const upload = multer({ storage, fileFilter: checkFile, limits: { fileSize: 15 * 1024 * 1024 } });
const router = express.Router();

router.get('/', getFiles);
router.get('/:id/download', downloadFile);
router.post('/upload', protect, upload.single('file'), uploadFile);

export default router;
