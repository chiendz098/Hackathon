const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Upload file
router.post('/upload', auth, upload.single('file'), (req, res) => {
  res.json({ 
    filename: req.file.filename, 
    url: `/api/file/download/${req.file.filename}`,
    fileUrl: `/api/file/download/${req.file.filename}` // For compatibility
  });
});

// Download file
router.get('/download/:filename', auth, (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

// Lấy danh sách file
router.get('/list', auth, (req, res) => {
  const files = fs.readdirSync(uploadDir).map(f => ({ filename: f, url: `/api/file/download/${f}` }));
  res.json(files);
});

module.exports = router; 