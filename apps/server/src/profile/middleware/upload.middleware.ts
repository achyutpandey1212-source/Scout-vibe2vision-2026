import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter(req, file, callback) {
    if (file.mimetype !== 'application/pdf') {
      return callback(new Error('Unsupported file type.'));
    }
    callback(null, true);
  },
});

export const resumeUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Resume exceeds 10 MB.' },
        });
      }
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: err.message || 'File upload failed.' },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Empty file uploaded.' },
      });
    }

    // Magic bytes check (first 4 bytes must be "%PDF")
    const buffer = req.file.buffer;
    if (buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Invalid PDF file.' },
      });
    }

    next();
  });
};
