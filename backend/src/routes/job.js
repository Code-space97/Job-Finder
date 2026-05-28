/**
 * routes/job.js
 * POST /api/job/match  - Run matching between a resume and a job description
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const Resume = require("../models/Resume");
const JobMatch = require("../models/JobMatch");
const Usage = require("../models/Usage");
const { extractText } = require("../utils/parseResume");
const { matchResumeToJob } = require("../utils/matcher");
const { searchJobs } = require("../utils/jobSearch");
const fs = require("fs");

const FREE_LIMIT = Number(process.env.FREE_JOB_MATCHES_PER_MONTH) || 10;

// ── POST /api/job/match ──────────────────────────────────────────────────────
// Accepts either a text job description (req.body.jobDescription) OR a PDF/DOCX file upload.
// Also needs resumeId in body.
router.post(
    "/match",
    protect,
    upload.single("jobFile"), // optional file upload for JD
    async (req, res, next) => {
        const jdFilePath = req.file?.path;
        try {
            const { resumeId, jobDescription, jobTitle } = req.body;

            if (!resumeId) {
                return res.status(400).json({ error: "resumeId is required." });
            }

            // Resolve job description text
            let jobText = jobDescription;
            if (req.file) {
                jobText = await extractText(jdFilePath, req.file.mimetype);
                if (jdFilePath && fs.existsSync(jdFilePath)) fs.unlinkSync(jdFilePath);
            }

            if (!jobText || jobText.trim().length < 20) {
                return res.status(400).json({ error: "A job description (text or file) is required." });
            }

            // Fetch the resume
            const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
            if (!resume) return res.status(404).json({ error: "Resume not found." });

            // Check free tier limit
            let usage = await Usage.findOne({ user: req.user._id });
            if (!usage) usage = await Usage.create({ user: req.user._id });
            await usage.resetIfNewMonth();

            if (req.user.plan === "free" && usage.jobMatchesThisMonth >= FREE_LIMIT) {
                return res.status(429).json({
                    error: "Free tier limit reached. You can run up to 10 job matches per month.",
                    limitReached: true,
                    plan: "free",
                });
            }

            // Run matching algorithm
            const { matchScore, matchingSkills, missingSkills, explanation } = matchResumeToJob(
                resume.rawText,
                jobText,
                resume.parsedData?.skills || []
            );

            // Save match result
            const jobMatch = await JobMatch.create({
                user: req.user._id,
                resume: resume._id,
                jobDescription: jobText.slice(0, 5000), // store trimmed version
                jobTitle: jobTitle || "Untitled Position",
                matchScore,
                matchingSkills,
                missingSkills,
                explanation,
                usedLLM: false,
            });

            // Increment usage
            usage.jobMatchesThisMonth += 1;
            await usage.save();

            res.json({ matchResult: jobMatch });
        } catch (err) {
            if (jdFilePath && fs.existsSync(jdFilePath)) fs.unlinkSync(jdFilePath);
            next(err);
        }
    }
);

// ── GET /api/job/search ──────────────────────────────────────────────────────
// Searches for real-time jobs based on the resume and user-provided preferences.
router.get("/search/:resumeId", protect, async (req, res, next) => {
    try {
        const { jobTitle, location, remote, hybrid } = req.query;
        console.log("[JOB] Searching for:", { jobTitle, location, remote, hybrid });
        const resume = await Resume.findOne({ _id: req.params.resumeId, user: req.user._id });
        if (!resume) return res.status(404).json({ error: "Resume not found." });

        const resumeSkills = resume.parsedData?.skills || [];
        const resumeLocation = location || resume.parsedData?.contactInfo?.location || "";
        const searchTitle = jobTitle || resume.parsedData?.contactInfo?.title || resumeSkills[0] || "Software Engineer";

        // Fetch jobs based on title and location
        // Passing searchTitle as the primary keyword and location/remote flags
        const isRemote = remote === "true";
        const rawJobs = await searchJobs([searchTitle], resumeLocation, isRemote);

        // Enhance jobs with a match score against the resume
        const enhancedJobs = rawJobs.map(job => {
            const { matchScore, matchingSkills } = matchResumeToJob(
                resume.rawText,
                `${job.title} ${job.description}`,
                resumeSkills
            );
            return {
                ...job,
                matchScore,
                matchingSkills,
            };
        });

        // Sort by match score descending
        const filteredJobs = enhancedJobs.sort((a, b) => b.matchScore - a.matchScore);

        console.log("[JOB] Found matches:", filteredJobs?.length);
        res.json({ jobs: filteredJobs });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
