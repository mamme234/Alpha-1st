const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDir = (dir) => {
    const uploadDir = path.join(__dirname, 'uploads', dir);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'general';
        if (file.mimetype.startsWith('video/')) folder = 'videos';
        else if (file.mimetype.startsWith('image/')) folder = 'images';
        else if (file.mimetype.startsWith('audio/')) folder = 'audio';
        else if (file.mimetype === 'application/pdf') folder = 'documents';
        else if (file.originalname.endsWith('.json')) folder = 'documents';
        
        const uploadPath = createUploadDir(folder);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf', 'application/json',
        'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
};

// Create multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
        files: 5
    }
});

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'File too large. Max size is 50MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};

module.exports = {
    upload,
    handleUploadError
};
