/**
 * routes/auth.js
 * POST /api/auth/register  - Create account
 * POST /api/auth/login     - Login and receive JWT
 * GET  /api/auth/me        - Get current user (requires JWT)
 */
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/User");
const Usage = require("../models/Usage");
const { protect } = require("../middleware/auth");

/** Signs a JWT for a given user id */
const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res, next) => {
    try {
        console.log("[AUTH] Register attempt:", req.body.email);
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: "Invalid email address." });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters." });
        }

        // Check duplicate
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        // Create user
        const user = await User.create({
            name: validator.escape(name.trim()),
            email: email.toLowerCase().trim(),
            password,
        });

        // Create initial Usage document
        await Usage.create({ user: user._id });

        const token = signToken(user._id);
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
    try {
        console.log("[AUTH] Login attempt:", req.body.email);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        // Select password explicitly (it's hidden by default)
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        const token = signToken(user._id);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", protect, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
