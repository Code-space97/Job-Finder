/**
 * utils/groqParser.js
 * Optional: Uses the Groq API (LLM) for enhanced resume parsing.
 * Falls back gracefully if GROQ_API_KEY is not set.
 */
const Groq = require("groq-sdk");

let groqClient = null;

if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

/**
 * Parses a resume using Groq LLM for richer extraction.
 * Returns null if Groq is not configured.
 * @param {string} resumeText
 * @returns {Promise<object|null>}
 */
const parseWithGroq = async (resumeText) => {
    if (!groqClient) return null;

    try {
        const completion = await groqClient.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `You are an expert resume parser. Extract structured information from the given resume text and return ONLY valid JSON in this exact format:
{
  "skills": ["skill1", "skill2"],
  "experience": ["job title at company, year-year", ...],
  "education": ["degree, institution, year", ...],
  "contactInfo": {
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": ""
  }
}`,
                },
                {
                    role: "user",
                    content: `Parse this resume:\n\n${resumeText.slice(0, 4000)}`,
                },
            ],
            temperature: 0.1,
            max_tokens: 1024,
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        // Extract JSON from potential markdown code blocks
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        console.warn("[Groq Parser] Failed:", err.message);
        return null;
    }
};

module.exports = { parseWithGroq };
