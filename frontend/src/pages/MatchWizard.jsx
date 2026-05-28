import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileText, Zap, Globe } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";

export default function MatchWizard() {
    const navigate = useNavigate();
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState("upload"); // "upload" or "linkedin"
    const [linkedinUrl, setLinkedinUrl] = useState("");

    // ── Resume Upload ─────────────────────────────────────────────────────────
    const onDropResume = useCallback((accepted) => {
        if (accepted[0]) setResumeFile(accepted[0]);
    }, []);
    const resumeDropzone = useDropzone({
        onDrop: onDropResume,
        accept: {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
        },
        maxFiles: 1
    });

    const handleUploadResume = async () => {
        if (!resumeFile) { toast.error("Please select a resume file."); return; }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("resume", resumeFile);
            const { data } = await api.post("/resume/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Resume analyzed! Finding best matches...");
            // Navigate directly — backend uses parsedData for search
            navigate(`/jobs/${data.resume._id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || "Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    // ── LinkedIn URL ──────────────────────────────────────────────────────────
    const handleLinkedInMatch = async () => {
        if (!linkedinUrl.includes("linkedin.com/in/")) {
            toast.error("Please enter a valid LinkedIn Profile URL.");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post("/resume/linkedin", { url: linkedinUrl });
            toast.success("Profile analyzed! Finding best matches...");
            navigate(`/jobs/${data.resume._id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to fetch LinkedIn profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card space-y-6"
            >
                {/* Header */}
                <div className="text-center space-y-1 pb-2">
                    <h1 className="text-2xl font-black text-white">Find Your Perfect Job</h1>
                    <p className="text-slate-400 text-sm">Upload your resume or paste your LinkedIn URL to get instant matches.</p>
                </div>

                {/* Method Toggle */}
                <div className="flex bg-white/5 p-1 rounded-lg">
                    <button
                        onClick={() => setMethod("upload")}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${method === "upload" ? "bg-primary-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}
                    >
                        Resume Upload
                    </button>
                    <button
                        onClick={() => setMethod("linkedin")}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${method === "linkedin" ? "bg-primary-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}
                    >
                        LinkedIn URL
                    </button>
                </div>

                {/* Resume Upload */}
                {method === "upload" ? (
                    <div className="space-y-4">
                        <div
                            {...resumeDropzone.getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${resumeDropzone.isDragActive ? "border-primary-500 bg-primary-500/10" : "border-white/20 hover:border-white/40"
                                }`}
                        >
                            <input {...resumeDropzone.getInputProps()} />
                            <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                            {resumeFile ? (
                                <div>
                                    <p className="text-white font-medium">{resumeFile.name}</p>
                                    <p className="text-xs text-slate-400 mt-1">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-slate-300 font-medium">Drag & drop your resume here</p>
                                    <p className="text-sm text-slate-500 mt-1">or click to browse — PDF or DOCX</p>
                                </>
                            )}
                        </div>
                        <button
                            onClick={handleUploadResume}
                            disabled={loading || !resumeFile}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><FileText className="w-4 h-4" /> Analyze & Find Jobs</>
                            }
                        </button>
                    </div>
                ) : (
                    /* LinkedIn URL */
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Enter your <strong className="text-white">public</strong> LinkedIn profile URL and we'll extract your skills and experience automatically.
                        </p>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                className="input pl-10"
                                placeholder="https://www.linkedin.com/in/yourname"
                                value={linkedinUrl}
                                onChange={e => setLinkedinUrl(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleLinkedInMatch}
                            disabled={loading || !linkedinUrl}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><Zap className="w-4 h-4" /> Analyze & Find Jobs</>
                            }
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
