/**
 * utils/matcher.js
 * TF-IDF + Cosine Similarity based resume-to-job-description matcher.
 * Uses the `natural` library for Node.js NLP.
 */
const natural = require("natural");
const { SKILLS_DB } = require("./parseResume");

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Calculates cosine similarity between two TF-IDF vectors.
 * @param {object} vecA - { term: tfidf_score }
 * @param {object} vecB - { term: tfidf_score }
 * @returns {number} similarity score between 0 and 1
 */
const cosineSimilarity = (vecA, vecB) => {
    const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (const key of keys) {
        const a = vecA[key] || 0;
        const b = vecB[key] || 0;
        dotProduct += a * b;
        magnitudeA += a * a;
        magnitudeB += b * b;
    }

    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
};

/**
 * Converts a TF-IDF instance (single document) into a term-score map.
 */
const tfidfToVector = (tfidf, docIndex) => {
    const vector = {};
    tfidf.listTerms(docIndex).forEach(({ term, tfidf: score }) => {
        vector[term] = score;
    });
    return vector;
};

/**
 * Main matching function.
 * @param {string} resumeText - Raw resume text
 * @param {string} jobText - Raw job description text
 * @param {string[]} resumeSkills - Already-parsed skills from the resume
 * @returns {{ matchScore: number, matchingSkills: string[], missingSkills: string[], explanation: string }}
 */
const matchResumeToJob = (resumeText, jobText, resumeSkills = []) => {
    // ── 1. TF-IDF Cosine Similarity ──────────────────────────────────────────
    const tfidf = new TfIdf();
    tfidf.addDocument(resumeText.toLowerCase());
    tfidf.addDocument(jobText.toLowerCase());

    const resumeVec = tfidfToVector(tfidf, 0);
    const jobVec = tfidfToVector(tfidf, 1);
    const cosineSim = cosineSimilarity(resumeVec, jobVec);

    // ── 2. Skill Overlap Analysis ─────────────────────────────────────────────
    // Extract skills mentioned in the job description
    const jobSkills = SKILLS_DB.filter((skill) => {
        const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
        return regex.test(jobText);
    });

    const resumeSkillsLower = resumeSkills.map((s) => s.toLowerCase());
    const jobSkillsLower = jobSkills.map((s) => s.toLowerCase());

    const matchingSkills = jobSkills.filter((s) =>
        resumeSkillsLower.includes(s.toLowerCase())
    );
    const missingSkills = jobSkills.filter(
        (s) => !resumeSkillsLower.includes(s.toLowerCase())
    );

    // ── 3. Composite Score ────────────────────────────────────────────────────
    // Weight: 40% cosine similarity + 60% skill overlap ratio
    // We give more weight to skills as they are usually the primary filter
    const skillOverlapRatio =
        jobSkills.length > 0 ? matchingSkills.length / jobSkills.length : 0;

    // Use a non-linear scale for cosine similarity to boost low scores that have some relevance
    const boostedCosine = Math.pow(cosineSim, 0.7);

    const rawScore = boostedCosine * 0.4 + skillOverlapRatio * 0.6;

    // Convert to 0–100. If there are ANY matching skills, ensure score is at least 10%
    let matchScore = Math.round(rawScore * 100);
    if (matchingSkills.length > 0 && matchScore < 10) {
        matchScore = 10 + (matchingSkills.length * 2);
    }

    matchScore = Math.min(100, matchScore);

    // ── 4. Human-readable Explanation ────────────────────────────────────────
    let explanation = "";
    if (matchScore >= 75) {
        explanation = `Excellent match! Your resume strongly aligns with this job description. You possess ${matchingSkills.length} of the ${jobSkills.length} required skills.`;
    } else if (matchScore >= 50) {
        explanation = `Good match. Your resume covers key areas of this role. You have ${matchingSkills.length} of ${jobSkills.length} required skills. Consider adding: ${missingSkills.slice(0, 3).join(", ")}.`;
    } else if (matchScore >= 25) {
        explanation = `Partial match. Your background is somewhat relevant, but ${missingSkills.length} skills from the job description are missing from your resume.`;
    } else {
        explanation = `Low match. The job description requires skills and experience that are not prominent in your resume. Focus on upskilling in: ${missingSkills.slice(0, 5).join(", ")}.`;
    }

    return {
        matchScore,
        matchingSkills,
        missingSkills,
        explanation,
    };
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { matchResumeToJob };
