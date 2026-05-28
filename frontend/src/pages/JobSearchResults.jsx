import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { Briefcase, ExternalLink, MapPin, ArrowLeft, Globe, DollarSign, CheckCircle2 } from "lucide-react";

export default function JobSearchResults() {
    const { resumeId } = useParams();
    const [searchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const jobTitle = searchParams.get("jobTitle") || "";
    const location = searchParams.get("location") || "";
    const remote = searchParams.get("remote") === "true";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch resume details
                const resMatch = await api.get(`/user/history`);
                const foundResume = resMatch.data.resumes?.find(r => r._id === resumeId);
                setResume(foundResume);

                // Fetch real-time jobs with preference parameters
                const query = new URLSearchParams({ jobTitle, location, remote });
                const jobRes = await api.get(`/job/search/${resumeId}?${query.toString()}`);
                setJobs(jobRes.data.jobs);
            } catch (err) {
                setError("Failed to fetch job results. Please try again.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [resumeId, jobTitle, location, remote]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 animate-pulse">Finding the best matches for you...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link to="/match" className="btn-secondary">← Try Uploading Again</Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/match" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Recommended for You</h1>
                        <p className="text-sm text-slate-400">Based on {resume?.fileName || "Your Resume"}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    {jobTitle && <span className="px-2 py-0.5 rounded-full border border-white/10 text-slate-300">{jobTitle}</span>}
                    {location && <span className="px-2 py-0.5 rounded-full border border-white/10 text-slate-300">{location}</span>}
                    {remote && <span className="px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400">Remote</span>}
                </div>
            </div>

            <div className="grid gap-4">
                {jobs.length > 0 ? (
                    jobs.map((job, i) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="card group hover:border-primary-500/40"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors uppercase tracking-tight">{job.title}</h3>
                                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                                                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                                                    <Briefcase className="w-4 h-4 text-primary-400" /> {job.company}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5" /> {job.location}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Compatibility Score */}
                                        <div className="flex flex-col items-end">
                                            <div className={`text-2xl font-black ${job.matchScore > 80 ? "text-emerald-400" : job.matchScore > 50 ? "text-primary-400" : "text-amber-400"}`}>
                                                {job.matchScore}%
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Match</span>
                                        </div>
                                    </div>

                                    {/* Matching Skills */}
                                    {job.matchingSkills?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {job.matchingSkills.slice(0, 5).map(skill => (
                                                <span key={skill} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase">
                                                    <CheckCircle2 className="w-3 h-3" /> {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 italic">
                                        "{job.description}"
                                    </p>
                                </div>

                                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0">
                                    <div className="text-right">
                                        {job.salary !== "N/A" && (
                                            <div className="text-emerald-400 font-bold text-sm mb-1">{job.salary}</div>
                                        )}
                                        <div className="text-[10px] text-slate-500 font-medium uppercase">{new Date(job.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <a
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary w-full md:w-auto px-6 py-2.5 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform"
                                    >
                                        Apply Now <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="card text-center py-20 border-dashed border-white/5 bg-white/[0.01]">
                        <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-white font-semibold text-lg">No perfect matches found globally</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            Try broadening your search title or location for better results.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
