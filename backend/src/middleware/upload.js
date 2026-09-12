import multer from 'multer';
import path from 'path';
import { env } from '../config/env.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.UPLOAD_DIR || './uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Allowed: jpeg, png, gif, webp, pdf'), false);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: env.MAX_FILE_SIZE || 5*1024*1024 } });
