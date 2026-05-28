import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { CheckCircle2, XCircle, ArrowLeft, Zap, Briefcase, ExternalLink, MapPin } from "lucide-react";

export default function Results() {
    const { id } = useParams();
    const [match, setMatch] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/user/history?limit=100`)
            .then(({ data }) => {
                const found = data.matches.find((m) => m._id === id);
                if (found) {
                    setMatch(found);
                    // Fetch real-time jobs if resumeId is available
                    if (found.resume?._id || found.resume) {
                        const resumeId = found.resume?._id || found.resume;
                        setLoadingJobs(true);
                        api.get(`/job/search/${resumeId}`)
                            .then(res => setJobs(res.data.jobs))
                            .catch(err => console.error("Jobs fetch failed", err))
                            .finally(() => setLoadingJobs(false));
                    }
                }
                else setError("Match result not found.");
            })
            .catch(() => setError("Failed to load match result."))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error) return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link to="/dashboard" className="btn-secondary">← Back to Dashboard</Link>
        </div>
    );

    const score = match.matchScore;
    const scoreColor = score >= 70 ? "from-emerald-500 to-teal-400" : score >= 40 ? "from-amber-500 to-yellow-400" : "from-red-500 to-rose-400";
    const scoreLabel = score >= 70 ? "Excellent Match" : score >= 40 ? "Good Match" : score >= 20 ? "Partial Match" : "Low Match";

    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
            <div className="flex items-center gap-3">
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Match Results</h1>
            </div>

            {/* Score card */}
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card text-center relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${scoreColor} opacity-5`} />
                <p className="text-slate-400 text-sm mb-2">{match.jobTitle}</p>
                <div className={`text-7xl font-black bg-gradient-to-br ${scoreColor} bg-clip-text text-transparent my-4`}>
                    {score}%
                </div>
                <p className="text-white font-semibold text-lg mb-6">{scoreLabel}</p>

                {/* Progress bar */}
                <div className="max-w-sm mx-auto">
                    <div className="w-full bg-white/10 rounded-full h-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                            className={`h-3 rounded-full bg-gradient-to-r ${scoreColor}`}
                        />
                    </div>
                </div>

                {/* Explanation */}
                <p className="text-slate-300 text-sm mt-6 max-w-lg mx-auto leading-relaxed">
                    {match.explanation}
                </p>
            </motion.div>

            {/* Skills grid */}
            <div className="grid sm:grid-cols-2 gap-4">
                {/* Matching skills */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Matching Skills
                        <span className="ml-auto text-xs text-emerald-400 font-normal">{match.matchingSkills.length}</span>
                    </h2>
                    {match.matchingSkills.length === 0 ? (
                        <p className="text-sm text-slate-500">No matching skills detected.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {match.matchingSkills.map((s) => (
                                <span key={s} className="px-2.5 py-0.5 bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 rounded-full text-xs font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Missing skills */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
                    <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        Missing Skills
                        <span className="ml-auto text-xs text-red-400 font-normal">{match.missingSkills.length}</span>
                    </h2>
                    {match.missingSkills.length === 0 ? (
                        <p className="text-sm text-slate-400">🎉 You have all required skills!</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {match.missingSkills.map((s) => (
                                <span key={s} className="px-2.5 py-0.5 bg-red-400/10 text-red-300 border border-red-400/20 rounded-full text-xs font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Real-time Jobs Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary-400" />
                    Recommended Real-Time Jobs
                </h2>
                <p className="text-sm text-slate-400">
                    Based on the skills and location extracted from your resume.
                </p>

                {loadingJobs ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse bg-white/5" />)}
                    </div>
                ) : jobs.length > 0 ? (
                    <div className="space-y-4">
                        {jobs.map((job, i) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary-500/30 transition-all"
                            >
                                <div>
                                    <h3 className="font-bold text-white leading-tight">{job.title}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-400">
                                        <span className="font-medium text-slate-300">{job.company}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                                        {job.salary !== "N/A" && <span className="text-emerald-400/80 font-medium">{job.salary}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">{job.description}</p>
                                </div>
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary text-xs py-2 px-4 whitespace-nowrap flex items-center gap-1.5 self-start md:self-auto"
                                >
                                    Apply Now <ExternalLink className="w-3 h-3" />
                                </a>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-10 border-dashed">
                        <p className="text-slate-500 italic">No real-time jobs found for your profile. Try updating your skills or location.</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <Link to="/match" className="btn-primary flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Run Another Match
                </Link>
                <Link to="/dashboard" className="btn-secondary">Dashboard</Link>
            </div>
        </div>
    );
}
