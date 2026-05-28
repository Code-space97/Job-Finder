# Job Matcher AI 🚀

An AI-powered web application that helps job seekers match their resumes with job descriptions using NLP (TF-IDF & Cosine Similarity) and optional LLM parsing.

## 🛠 Features

- **Resume Parsing**: Automatically extracts skills, experience, and contact info from PDF/DOCX.
- **Smart Matching**: Uses Weighted TF-IDF and Cosine Similarity for a 0-100% match score.
- **Skill Gap Analysis**: Highlights matching and missing skills from the job description.
- **Usage Limits**: Built-in free tier management (5 resumes, 10 matches/month).
- **Modern UI**: Clean, responsive dashboard with a step-by-step match wizard.
- **Secure**: JWT-based authentication and protected routes.

## 🏗 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, Axios.
- **Backend**: Node.js, Express, Mongoose, JWT.
- **Database**: MongoDB (Local via Docker or Atlas).
- **NLP**: `natural` library (TF-IDF, Cosine Similarity), `pdf-parse`, `mammoth`.
- **Job Search**: Adzuna API integration for real-time job openings.
- **Optional**: Groq API for enhanced LLM-based parsing (Model: `llama-3.1-8b-instant`).

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Docker (for local MongoDB) OR a MongoDB Atlas URI

### 2. Setup Database
Start the local MongoDB using Docker:
```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your secrets if needed
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## 📁 Project Structure

```text
Job-Matcher/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── middleware/   # JWT Auth, Multer upload
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API endpoints (Auth, Resume, Job, User)
│   │   ├── utils/        # Matching & Parsing logic
│   │   └── server.js     # Entry point
│   └── uploads/          # Temporary file storage
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth state
│   │   ├── lib/          # API client (Axios)
│   │   ├── pages/        # App screens (Dashboard, Wizard, etc.)
│   │   └── App.jsx       # Routing
│   └── tailwind.config.js
└── docker-compose.yml    # Local MongoDB container
```

## 🔒 Environment Variables

**Backend (.env):**
- `MONGODB_URI`: Connection string.
- `JWT_SECRET`: Secret key for tokens.
- `GROQ_API_KEY`: (Optional) for better AI parsing.
- `FREE_RESUME_UPLOADS_PER_MONTH`: Default is 5.
- `FREE_JOB_MATCHES_PER_MONTH`: Default is 10.

## 📝 Deployment

1. **Frontend**: Deploy `frontend/` to Vercel/Netlify. Set `VITE_API_URL` to your backend.
2. **Backend**: Deploy `backend/` to Render/Railway. Set all `.env` variables.
3. **DB**: Use MongoDB Atlas (Free Tier).

---

