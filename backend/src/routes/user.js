/**
 * routes/user.js
 * GET    /api/user/usage    - Get current user's usage stats
 * GET    /api/user/history  - Get match history
 * PATCH  /api/user/profile  - Update profile info
 * POST   /api/user/upgrade  - Mock upgrade to premium
 */
const express = require("express");
const router = express.Router();
const validator = require("validator");
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const Usage = require("../models/Usage");
const JobMatch = require("../models/JobMatch");

// ── GET /api/user/usage ──────────────────────────────────────────────────────
router.get("/usage", protect, async (req, res, next) => {
    try {
        let usage = await Usage.findOne({ user: req.user._id });
        if (!usage) usage = await Usage.create({ user: req.user._id });
        await usage.resetIfNewMonth();

        const freeLimits = {
            resumeUploads: Number(process.env.FREE_RESUME_UPLOADS_PER_MONTH) || 5,
            jobMatches: Number(process.env.FREE_JOB_MATCHES_PER_MONTH) || 10,
        };

        res.json({
            plan: req.user.plan,
            usage: {
                resumeUploadsThisMonth: usage.resumeUploadsThisMonth,
                jobMatchesThisMonth: usage.jobMatchesThisMonth,
                periodStartDate: usage.periodStartDate,
            },
            limits: req.user.plan === "premium"
                ? { resumeUploads: "unlimited", jobMatches: "unlimited" }
                : freeLimits,
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/user/history ────────────────────────────────────────────────────
router.get("/history", protect, async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Number(req.query.limit) || 10);

        const [matches, total] = await Promise.all([
            JobMatch.find({ user: req.user._id })
                .populate("resume", "fileName createdAt")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            JobMatch.countDocuments({ user: req.user._id }),
        ]);

        res.json({ matches, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        next(err);
    }
});

// ── PATCH /api/user/profile ──────────────────────────────────────────────────
router.patch("/profile", protect, async (req, res, next) => {
    try {
        const { name, title, location, bio } = req.body;
        const updates = {};

        if (name) updates.name = validator.escape(name.trim().slice(0, 100));
        if (title !== undefined) updates.title = validator.escape(title.trim().slice(0, 100));
        if (location !== undefined) updates.location = validator.escape(location.trim().slice(0, 100));
        if (bio !== undefined) updates.bio = validator.escape(bio.trim().slice(0, 500));

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        });

        res.json({ user });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/user/upgrade ───────────────────────────────────────────────────
// Mock upgrade endpoint - in production this would integrate with Stripe
router.post("/upgrade", protect, async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { plan: "premium" },
            { new: true }
        );
        res.json({
            message: "Successfully upgraded to Premium! 🎉",
            user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
