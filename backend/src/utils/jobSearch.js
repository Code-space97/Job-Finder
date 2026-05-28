/**
 * utils/jobSearch.js
 * Multi-provider job search utility.
 * Mode A: Jooble (Primary) — free key from jooble.org/api/about
 * Mode B: Remotive + Arbeitnow fallback — no key needed
 */
const axios = require("axios");

const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

// ── Main entry point ──────────────────────────────────────────────────────────
const searchJobs = async (queryItems, location, remoteOnly = false) => {
    if (JOOBLE_API_KEY && JOOBLE_API_KEY !== "your_key_here") {
        return searchJooble(queryItems, location, remoteOnly);
    }
    console.log("[JobSearch] No Jooble key found. Using Free Fallback...");
    return searchFreeFallback(queryItems, location, remoteOnly);
};

// ── Jooble Implementation ─────────────────────────────────────────────────────
async function searchJooble(queryItems, location, remoteOnly) {
    try {
        const searchTerm = queryItems[0] || "Software Engineer";
        console.log(`[JobSearch] Searching Jooble for: "${searchTerm}" in "${location || "Any"}"`);

        const response = await axios.post(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
            keywords: searchTerm + (remoteOnly ? " remote" : ""),
            location: location || "",
            page: "1",
        });

        const results = response.data.jobs || [];
        return results.map(job => ({
            id: job.id?.toString() || Math.random().toString(),
            title: job.title,
            company: job.company || "Company",
            location: job.location || "Worldwide",
            description: job.snippet?.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 500) + "...",
            url: job.link,
            salary: job.salary || "Competitive",
            source: job.source || "Jooble",
            createdAt: job.updated || new Date().toISOString(),
        }));
    } catch (err) {
        console.error("[JobSearch] Jooble error (falling back):", err.message);
        return searchFreeFallback(queryItems, location, remoteOnly);
    }
}

// ── Free Fallback: Remotive + Arbeitnow ──────────────────────────────────────
async function searchFreeFallback(queryItems, location, remoteOnly) {
    const searchTerm = queryItems[0]?.toLowerCase() || "";
    const jobs = [];

    try {
        // 1. Remotive (public API)
        const remotiveRes = await axios.get(
            `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchTerm)}&limit=15`
        );
        (remotiveRes.data.jobs || []).forEach(j => {
            jobs.push({
                id: `rem-${j.id}`,
                title: j.title,
                company: j.company_name,
                location: j.candidate_required_location || "Remote",
                description: j.description.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300) + "...",
                url: j.url,
                salary: j.salary || "Competitive",
                source: "Remotive",
                createdAt: j.publication_date,
            });
        });

        // 2. Arbeitnow (public API)
        const arbeitRes = await axios.get("https://www.arbeitnow.com/api/job-board-api");
        (arbeitRes.data.data || []).slice(0, 30).forEach(j => {
            if (j.title.toLowerCase().includes(searchTerm) || j.description.toLowerCase().includes(searchTerm)) {
                jobs.push({
                    id: `arb-${j.slug}`,
                    title: j.title,
                    company: j.company_name,
                    location: j.location + (j.remote ? " (Remote)" : ""),
                    description: j.description.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 300) + "...",
                    url: j.url,
                    salary: "Competitive",
                    source: "Arbeitnow",
                    createdAt: j.created_at,
                });
            }
        });

        return jobs.slice(0, 20);
    } catch (err) {
        console.error("[JobSearch] Free fallback error:", err.message);
        return [];
    }
}

module.exports = { searchJobs };
