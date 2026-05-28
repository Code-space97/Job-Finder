/**
 * middleware/upload.js
 * Multer configuration for resume file uploads.
 * Validates MIME type and file size.
 */
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const MAX_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 5;
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        // Sanitize filename: strip special chars, add timestamp
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${sanitized}`);
    },
});

const fileFilter = (_req, file, cb) => {
    const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF and DOCX/DOC files are allowed."), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

module.exports = { upload };
