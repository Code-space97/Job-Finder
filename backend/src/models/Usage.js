/**
 * models/Usage.js
 * Tracks monthly usage per user for free-tier limiting.
 */
const mongoose = require("mongoose");

const UsageSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One usage document per user
        },
        // Current month's counters
        resumeUploadsThisMonth: { type: Number, default: 0 },
        jobMatchesThisMonth: { type: Number, default: 0 },
        // Tracks when the monthly counters were last reset
        periodStartDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

/**
 * Resets monthly counters if a new calendar month has started.
 */
UsageSchema.methods.resetIfNewMonth = async function () {
    const now = new Date();
    const periodStart = new Date(this.periodStartDate);
    const isNewMonth =
        now.getFullYear() !== periodStart.getFullYear() ||
        now.getMonth() !== periodStart.getMonth();

    if (isNewMonth) {
        this.resumeUploadsThisMonth = 0;
        this.jobMatchesThisMonth = 0;
        this.periodStartDate = now;
        await this.save();
    }
};

module.exports = mongoose.model("Usage", UsageSchema);
