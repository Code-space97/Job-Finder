/**
 * utils/linkedinScraper.js
 * Free LinkedIn profile analyzer.
 *
 * Strategy:
 * 1. Fetch the public LinkedIn page — even if LinkedIn shows a login wall,
 *    the <title> and <meta> tags still contain the person's name & headline.
 * 2. Feed that info to Groq AI to intelligently generate a full skills list.
 * 3. Return structured profile data for job matching.
 *
 * ✅ Zero cost — no API keys needed beyond the existing Groq key.
 */
const axios = require("axios");
const cheerio = require("cheerio");
const Groq = require("groq-sdk");

let groqClient = null;
if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

/**
 * Scrapes a public LinkedIn profile URL and returns structured profile data.
 */
const scrapeLinkedInProfile = async (profileUrl) => {
    const url = profileUrl.startsWith("http") ? profileUrl : `https://${profileUrl}`;
    console.log("[LinkedInScraper] Processing:", url);

    // ── Step 1: Fetch whatever LinkedIn gives us ──────────────────────────────
    let name = "";
    let headline = "";
    let locationStr = "";
    let description = "";

    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            maxRedirects: 5,
            timeout: 12000,
            validateStatus: (status) => status < 500, // Accept 999, 403, etc.
        });

        const $ = cheerio.load(response.data);

        // LinkedIn embeds info in meta/title even on login-gated pages
        const ogTitle = $('meta[property="og:title"]').attr("content") || "";
        const ogDesc  = $('meta[property="og:description"]').attr("content") || "";
        const titleTag = $("title").text() || "";

        // Parse: "John Doe - Senior Developer - Company | LinkedIn"
        if (ogTitle) {
            const parts = ogTitle.split(" - ");
            name = parts[0]?.trim() || "";
            headline = parts.slice(1).join(" - ").replace(/\s*\|.*$/, "").trim();
        }
        if (!name && titleTag) {
            const parts = titleTag.split(" - ");
            name = parts[0]?.trim() || "";
            headline = parts.slice(1).join(" - ").replace(/\s*\|.*$/, "").trim();
        }
        description = ogDesc || "";

        // Try extracting location from description
        const locMatch = description.match(/(?:Location|Based in|📍)\s*[:–-]?\s*([A-Za-z\s,]+)/i);
        if (locMatch) locationStr = locMatch[1].trim();

        console.log(`[LinkedInScraper] Extracted: name="${name}", headline="${headline}"`);
    } catch (fetchErr) {
        console.warn("[LinkedInScraper] Fetch partially failed:", fetchErr.message);
        // Even on failure, try to extract username from URL
        const usernameMatch = url.match(/linkedin\.com\/in\/([^/?#]+)/);
        if (usernameMatch) {
            name = usernameMatch[1].replace(/-/g, " ");
        }
    }

    // ── Step 2: Use Groq AI to generate a proper skill profile ────────────────
    if (!name && !headline) {
        throw new Error("Could not extract any information from this LinkedIn profile. Please make sure it is a public profile.");
    }

    let skills = [];
    let jobTitle = headline;

    if (groqClient && (headline || name)) {
        try {
            const prompt = `Based on this LinkedIn profile info, generate a realistic professional skills list.

Name: ${name}
Headline/Title: ${headline}
Description: ${description}

Return ONLY a JSON object in this exact format (no explanation, no markdown):
{
  "title": "their professional title",
  "location": "their location if mentioned, otherwise empty string",
  "skills": ["skill1", "skill2", "skill3", ...],
  "experience_summary": "brief 1-line summary of their likely experience"
}

Generate 8-15 relevant technical and professional skills based on their headline. Be specific and realistic.`;

            const completion = await groqClient.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are an expert recruiter who can infer professional skills from LinkedIn headlines. Return ONLY valid JSON." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.3,
                max_tokens: 512,
            });

            const raw = completion.choices[0]?.message?.content || "{}";
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                skills = parsed.skills || [];
                jobTitle = parsed.title || headline;
                if (parsed.location && !locationStr) locationStr = parsed.location;
            }
            console.log(`[LinkedInScraper] Groq generated ${skills.length} skills`);
        } catch (aiErr) {
            console.warn("[LinkedInScraper] Groq AI fallback failed:", aiErr.message);
        }
    }

    // ── Step 3: Build final profile ───────────────────────────────────────────
    const rawText = `
Name: ${name}
Title: ${jobTitle}
Location: ${locationStr}
Description: ${description}
Skills: ${skills.join(", ")}
Source: LinkedIn Profile (${url})
    `.trim();

    return {
        fullName: name || "LinkedIn User",
        rawText,
        parsedData: {
            contactInfo: {
                name: name || "LinkedIn User",
                title: jobTitle || headline || "Professional",
                location: locationStr,
            },
            skills,
            experience: [],
        },
    };
};

module.exports = { scrapeLinkedInProfile };
