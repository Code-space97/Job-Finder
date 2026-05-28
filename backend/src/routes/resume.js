/**
 * routes/resume.js
 * POST /api/resume/upload  - Upload, parse, and store a resume (requires auth)
 * GET  /api/resume/list    - List all resumes for the current user
 * GET  /api/resume/:id     - Get a single resume by ID
 * DELETE /api/resume/:id   - Delete a resume
 */
const express = require("express");
const router = express.Router();
const fs = require("fs");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const Resume = require("../models/Resume");
const Usage = require("../models/Usage");
const { extractText, parseResumeText } = require("../utils/parseResume");
const { parseWithGroq } = require("../utils/groqParser");
const { scrapeLinkedInProfile } = require("../utils/linkedinScraper");

const FREE_LIMIT = Number(process.env.FREE_RESUME_UPLOADS_PER_MONTH) || 5;

// ── POST /api/resume/linkedin ───────────────────────────────────────────────
router.post("/linkedin", protect, async (req, res, next) => {
    const { url } = req.body;
    console.log("[RESUME] Processing LinkedIn URL:", url);

    try {
        if (!url || !url.includes("linkedin.com/in/")) {
            return res.status(400).json({ error: "Invalid LinkedIn Profile URL." });
        }

        // Check usage limit
        let usage = await Usage.findOne({ user: req.user._id });
        if (!usage) usage = await Usage.create({ user: req.user._id });
        await usage.resetIfNewMonth();

        if (req.user.plan === "free" && usage.resumeUploadsThisMonth >= FREE_LIMIT) {
            return res.status(429).json({
                error: "Free tier limit reached.",
                limitReached: true,
            });
        }

        // Use scraper utility
        const profile = await scrapeLinkedInProfile(url);

        // Save as a "Resume" entry but tagged as LinkedIn
        const resume = await Resume.create({
            user: req.user._id,
            fileName: `LinkedIn: ${profile.fullName}`,
            fileSize: 0,
            mimeType: "text/x-linkedin-profile",
            rawText: profile.rawText,
            parsedData: profile.parsedData,
        });

        usage.resumeUploadsThisMonth += 1;
        await usage.save();

        res.status(201).json({ message: "LinkedIn profile imported successfully.", resume });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/resume/upload ──────────────────────────────────────────────────
router.post(
    "/upload",
    protect,
    upload.single("resume"),
    async (req, res, next) => {
        const filePath = req.file?.path;
        console.log("[RESUME] Uploading file:", req.file?.originalname);
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded." });
            }

            // Check free tier limit
            let usage = await Usage.findOne({ user: req.user._id });
            if (!usage) usage = await Usage.create({ user: req.user._id });
            await usage.resetIfNewMonth();

            if (req.user.plan === "free" && usage.resumeUploadsThisMonth >= FREE_LIMIT) {
                // Clean up the uploaded file
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return res.status(429).json({
                    error: "Free tier limit reached. You can upload up to 5 resumes per month.",
                    limitReached: true,
                    plan: "free",
                });
            }

            // Extract text
            const rawText = await extractText(filePath, req.file.mimetype);
            
            // Clean up the uploaded file from local disk as we only need the extracted text
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            if (!rawText || rawText.trim().length < 50) {
                return res.status(422).json({ error: "Could not extract meaningful text from the file. Please check the file content." });
            }

            // Parse resume (try Groq first, fallback to regex parser)
            let parsedData = await parseWithGroq(rawText);
            if (!parsedData) {
                parsedData = parseResumeText(rawText);
            }

            // Save to DB
            const resume = await Resume.create({
                user: req.user._id,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                rawText,
                parsedData,
            });

            // Increment usage counter
            usage.resumeUploadsThisMonth += 1;
            await usage.save();

            console.log("[RESUME] Upload complete. ID:", resume._id);
            res.status(201).json({ message: "Resume uploaded and parsed successfully.", resume });
        } catch (err) {
            // Cleanup file on unexpected error
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
            next(err);
        }
    }
);

// ── GET /api/resume/list ─────────────────────────────────────────────────────
router.get("/list", protect, async (req, res, next) => {
    try {
        const resumes = await Resume.find({ user: req.user._id })
            .select("-rawText") // don't return huge text blobs in the list
            .sort({ createdAt: -1 });
        res.json({ resumes });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/resume/:id ──────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res, next) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
        if (!resume) return res.status(404).json({ error: "Resume not found." });
        res.json({ resume });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/resume/:id ───────────────────────────────────────────────────
router.delete("/:id", protect, async (req, res, next) => {
    try {
        const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!resume) return res.status(404).json({ error: "Resume not found." });
        res.json({ message: "Resume deleted." });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
