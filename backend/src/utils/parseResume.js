/**
 * utils/parseResume.js
 * Handles text extraction from PDF and DOCX files.
 * Also does light NLP parsing to extract skills, contact info, etc.
 */
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

// A curated list of common technical and soft skills for extraction
const SKILLS_DB = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Bash", "Shell",
    // Frontend
    "React", "Vue", "Angular", "Next.js", "Nuxt.js", "Svelte", "HTML", "CSS", "SASS", "LESS",
    "Tailwind", "Bootstrap", "jQuery", "Redux", "Zustand", "GraphQL",
    // Backend
    "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Rails", "Laravel",
    "NestJS", "ASP.NET",
    // Databases
    "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Elasticsearch", "DynamoDB",
    "Cassandra", "Firebase", "Supabase",
    // Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions",
    "Jenkins", "Ansible", "Nginx", "Linux",
    // Data & ML
    "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "Keras", "OpenCV",
    "Hugging Face", "LangChain", "Machine Learning", "Deep Learning", "NLP", "LLM",
    // Tools
    "Git", "GitHub", "GitLab", "Jira", "Figma", "Postman", "VS Code", "Webpack", "Vite",
    // Soft Skills
    "leadership", "communication", "teamwork", "problem-solving", "agile", "scrum",
    "project management", "time management", "critical thinking",
    // Other
    "REST", "API", "microservices", "DevOps", "blockchain", "solidity", "WebSocket",
];

/**
 * Extracts raw text from a PDF or DOCX file.
 * @param {string} filePath - Absolute path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Extracted text
 */
const extractText = async (filePath, mimeType) => {
    if (
        mimeType === "application/pdf" ||
        path.extname(filePath).toLowerCase() === ".pdf"
    ) {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return data.text;
    } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/msword" ||
        [".docx", ".doc"].includes(path.extname(filePath).toLowerCase())
    ) {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    }
    throw new Error("Unsupported file type for text extraction.");
};

/**
 * Parses raw resume text to extract structured data.
 * @param {string} text - Raw text content of the resume
 * @returns {object} parsedData - { skills, experience, education, contactInfo }
 */
const parseResumeText = (text) => {
    // Normalize text
    const normalizedText = text.replace(/\r\n/g, "\n").replace(/\s+/g, " ");

    // ── Skills Extraction ───────────────────────────────────────────────────────
    const foundSkills = SKILLS_DB.filter((skill) => {
        const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
        return regex.test(normalizedText);
    });

    // ── Contact Info Extraction ────────────────────────────────────────────────
    const emailMatch = normalizedText.match(
        /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
    );
    const phoneMatch = normalizedText.match(
        /(\+?\d[\d\s\-().]{8,14}\d)/
    );
    const linkedinMatch = normalizedText.match(
        /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i
    );
    // ── Location Extraction ──────────────────────────────────────────────────
    // Heuristic: Looking for "City, State", "City, Country", or address patterns
    const locationMatch = normalizedText.match(
        /\b([A-Z][a-z]+(?: [A-Z][a-z]+)*, [A-Z]{2,}|[A-Z][a-z]+(?: [A-Z][a-z]+)*, [A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/
    );

    // ── Experience Extraction (heuristic: lines near keywords) ────────────────
    const experienceKeywords = /\b(experience|work|job|role|position|employment|company|organization)\b/i;
    const experienceLines = normalizedText
        .split("\n")
        .filter((line) => line.length > 20 && experienceKeywords.test(line))
        .slice(0, 10)
        .map((l) => l.trim());

    // ── Education Extraction ──────────────────────────────────────────────────
    const educationKeywords = /\b(education|degree|university|college|bachelor|master|phd|b\.tech|m\.tech|b\.e|m\.e|b\.sc|m\.sc)\b/i;
    const educationLines = normalizedText
        .split("\n")
        .filter((line) => line.length > 10 && educationKeywords.test(line))
        .slice(0, 5)
        .map((l) => l.trim());

    return {
        skills: [...new Set(foundSkills)],
        experience: experienceLines,
        education: educationLines,
        contactInfo: {
            email: emailMatch ? emailMatch[0] : "",
            phone: phoneMatch ? phoneMatch[0].trim() : "",
            linkedin: linkedinMatch ? linkedinMatch[0] : "",
            location: locationMatch ? locationMatch[0] : "",
        },
    };
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { extractText, parseResumeText, SKILLS_DB };
