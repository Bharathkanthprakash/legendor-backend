import express from 'express';
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest:'uploads/' });

router.post('/media', upload.single('file'), (req,res) => {
  const path = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ path });
});

export default router;
