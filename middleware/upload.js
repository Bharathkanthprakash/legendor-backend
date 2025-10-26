import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for post media
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'post-' + uniqueSuffix + fileExtension);
  }
});

// Configure storage for profile pictures
const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const profilePicsDir = 'uploads/profile-pics';
    if (!fs.existsSync(profilePicsDir)) {
      fs.mkdirSync(profilePicsDir, { recursive: true });
    }
    cb(null, profilePicsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'profile-' + (req.user?.id || 'user') + '-' + uniqueSuffix + fileExtension);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Configure multer for post media
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  }
});

// Configure multer for profile pictures
const uploadProfilePic = multer({
  storage: profilePicStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
  }
});

// Middleware for single file upload (posts)
const uploadSingle = upload.single('media');

// Middleware for profile picture upload
const uploadProfilePicture = uploadProfilePic.single('profilePicture');

// Error handling middleware for uploads
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Please upload a smaller file.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Please upload only one file.' 
      });
    }
  } else if (err) {
    return res.status(400).json({ 
      error: err.message 
    });
  }
  next();
};

export {
  uploadSingle,
  uploadProfilePicture,
  handleUploadError
};
