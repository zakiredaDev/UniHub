import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ObjectId } from 'mongodb';
import getFilesCollection from '../models/File.js';
import getSubjectsCollection from '../models/Subject.js';
import getUsers from '../models/User.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function getDisplayName(file) {
  const extension = path.extname(file.originalName || '');
  const title = file.title || file.originalName || 'ملف';
  return title.toLowerCase().endsWith(extension.toLowerCase()) ? title : `${title}${extension}`;
}

async function getFiles(req, res) {
  try {
    const filter = req.query.subject && ObjectId.isValid(req.query.subject)
      ? { subject: new ObjectId(req.query.subject) }
      : {};
    const files = await getFilesCollection().find(filter).sort({ createdAt: -1 }).toArray();
    const result = await Promise.all(files.map(async (file) => {
      const [subject, uploader] = await Promise.all([
        getSubjectsCollection().findOne({ _id: file.subject }),
        getUsers().findOne({ _id: file.uploader }, { projection: { name: 1, avatarUrl: 1 } })
      ]);
      return { ...file, displayName: getDisplayName(file), subject, uploader };
    }));
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'مش قادرين نجيب الملفات دلوقتي.' });
  }
}

async function uploadFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'اختار ملف الأول.' });
    const { title, subject } = req.body;
    if (!title || !subject) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'اسم الملف والمادة مطلوبين.' });
    }

    if (!ObjectId.isValid(subject) || !ObjectId.isValid(req.userId)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'المادة أو الحساب مش صالح.' });
    }

    const decodedName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const originalName = decodedName.includes('\uFFFD') ? req.file.originalname : decodedName;
    const savedFile = {
      title,
      originalName,
      fileName: req.file.filename,
      subject: new ObjectId(subject),
      uploader: new ObjectId(req.userId),
      size: req.file.size,
      mimeType: req.file.mimetype,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await getFilesCollection().insertOne(savedFile);
    savedFile._id = result.insertedId;

    return res.status(201).json(savedFile);
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: 'مش قادرين نحفظ الملف.' });
  }
}

async function downloadFile(req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'رقم الملف غير صالح.' });
    const savedFile = await getFilesCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!savedFile) return res.status(404).json({ message: 'الملف مش موجود.' });

    const filePath = path.join(currentDir, '../uploads', savedFile.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'الملف مش موجود على السيرفر.' });
    return res.download(filePath, getDisplayName(savedFile));
  } catch (error) {
    return res.status(400).json({ message: 'رقم الملف غير صالح.' });
  }
}

export { getFiles, uploadFile, downloadFile };
