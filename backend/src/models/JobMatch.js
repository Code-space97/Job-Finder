/**
 * models/JobMatch.js
 * Stores results of each resume-to-job-description matching operation.
 */
const mongoose = require("mongoose");

const JobMatchSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        resume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
        },
        // The job description (raw text, from paste or parsed PDF)
        jobDescription: { type: String, required: true },
        jobTitle: { type: String, default: "Untitled Position" },
        // Results
        matchScore: { type: Number, min: 0, max: 100, required: true }, // 0–100
        matchingSkills: [String],
        missingSkills: [String],
        explanation: { type: String },
        // Whether Groq LLM was used for enhanced analysis
        usedLLM: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("JobMatch", JobMatchSchema);
