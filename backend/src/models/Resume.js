/**
 * models/Resume.js
 * Stores parsed resume text and extracted data for a user.
 */
const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fileName: { type: String, required: true },
        fileSize: { type: Number }, // in bytes
        mimeType: { type: String },
        // Raw extracted text from PDF/DOCX
        rawText: { type: String, required: true },
        // Parsed structured data
        parsedData: {
            skills: [String],
            experience: [String],
            education: [String],
            contactInfo: {
                email: String,
                phone: String,
                location: String,
                linkedin: String,
            },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Resume", ResumeSchema);
