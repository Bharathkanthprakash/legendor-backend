import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure local upload directories exist (fallback)
const ensureDirectories = () => {
  const dirs = ['uploads', 'uploads/posts', 'uploads/profile-pics', 'uploads/stories'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectories();

// Storage configuration for local (fallback)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    if (req.baseUrl.includes('profiles')) {
      folder = 'uploads/profile-pics/';
    } else if (req.baseUrl.includes('stories')) {
      folder = 'uploads/stories/';
    } else {
      folder = 'uploads/posts/';
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// File filters
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const mediaFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Multer configurations
const upload = multer({
  storage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
});

const uploadProfile = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Middlewares
const uploadSingle = upload.single('media');
const uploadMultiple = upload.array('media', 10);
const uploadProfilePicture = uploadProfile.single('profilePicture');

// Cloudinary upload function
const uploadToCloudinary = async (filePath, folder = 'legendor') => {
  try {
    console.log(`📤 Uploading to Cloudinary folder: ${folder}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `legendor/${folder}`,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    // Delete local file after successful upload
    fs.unlinkSync(filePath);
    
    console.log(`✅ Cloudinary upload successful: ${result.secure_url}`);
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
    
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    
    // Fallback: return local path if Cloudinary fails
    const localUrl = `/${filePath.replace(/\\/g, '/')}`;
    console.log(`🔄 Falling back to local storage: ${localUrl}`);
    
    return {
      url: localUrl,
      public_id: null,
      format: path.extname(filePath).replace('.', ''),
      bytes: fs.statSync(filePath).size
    };
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Deleted from Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
  }
};

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 50MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum is 10 files.' 
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
  uploadMultiple,
  uploadProfilePicture,
  handleUploadError,
  uploadToCloudinary,
  deleteFromCloudinary
};
