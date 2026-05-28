import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Zap, FileText, Clock, TrendingUp, Crown, Plus } from "lucide-react";

export default function Dashboard() {
    const { user } = useAuth();
    const [usage, setUsage] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingUsage, setLoadingUsage] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        api.get("/user/usage")
            .then((r) => setUsage(r.data))
            .catch(() => toast.error("Failed to load usage data"))
            .finally(() => setLoadingUsage(false));

        api.get("/user/history?limit=5")
            .then((r) => setHistory(r.data.matches))
            .catch(() => toast.error("Failed to load history"))
            .finally(() => setLoadingHistory(false));
    }, []);

    const handleUpgrade = async () => {
        setUpgrading(true);
        try {
            const { data } = await api.post("/user/upgrade");
            toast.success(data.message);
            setUsage((prev) => ({ ...prev, plan: "premium", limits: { resumeUploads: "unlimited", jobMatches: "unlimited" } }));
        } catch {
            toast.error("Upgrade failed. Try again.");
        } finally {
            setUpgrading(false);
        }
    };

    const resumeLimit = typeof usage?.limits?.resumeUploads === "number" ? usage.limits.resumeUploads : null;
    const matchLimit = typeof usage?.limits?.jobMatches === "number" ? usage.limits.jobMatches : null;

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Welcome, {user?.name?.split(" ")[0]} 👋</h1>
                <p className="text-slate-400 mt-1">Here's your job matching overview.</p>
            </motion.div>

            {/* Free tier upgrade banner */}
            {usage?.plan === "free" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="card border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Crown className="w-8 h-8 text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold text-white">You're on the Free plan</p>
                        <p className="text-sm text-slate-400">Upgrade to Premium for unlimited uploads and matches, plus priority AI parsing.</p>
                    </div>
                    <button onClick={handleUpgrade} disabled={upgrading}
                        className="btn-primary bg-amber-500 hover:bg-amber-400 flex-shrink-0">
                        {upgrading ? "Upgrading..." : "Upgrade to Premium"}
                    </button>
                </motion.div>
            )}

            {/* Usage stats */}
            {!loadingUsage && usage && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid sm:grid-cols-2 gap-4">
                    <UsageMeter
                        icon={<FileText className="w-5 h-5" />}
                        label="Resume Uploads"
                        used={usage.usage.resumeUploadsThisMonth}
                        limit={resumeLimit}
                        plan={usage.plan}
                    />
                    <UsageMeter
                        icon={<Zap className="w-5 h-5" />}
                        label="Job Matches"
                        used={usage.usage.jobMatchesThisMonth}
                        limit={matchLimit}
                        plan={usage.plan}
                    />
                </motion.div>
            )}

            {/* Quick action */}
            <Link to="/match" className="card border-dashed border-primary-500/30 hover:border-primary-500/60 transition-all flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 group-hover:bg-primary-500/20 flex items-center justify-center transition-colors">
                    <Plus className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                    <p className="font-semibold text-white">Start a New Match</p>
                    <p className="text-sm text-slate-400">Upload a resume and paste a job description</p>
                </div>
                <Zap className="w-5 h-5 text-primary-400 ml-auto" />
            </Link>

            {/* Match History */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" /> Recent Matches
                    </h2>
                </div>
                {loadingHistory ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card animate-pulse h-16 bg-white/3" />
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="card text-center py-12 text-slate-400">
                        <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No matches yet. <Link to="/match" className="text-primary-400 hover:underline">Run your first match</Link></p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((match) => (
                            <Link key={match._id} to={`/results/${match._id}`}
                                className="card flex items-center gap-4 hover:border-white/20 transition-all group">
                                <ScoreBadge score={match.matchScore} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{match.jobTitle}</p>
                                    <p className="text-xs text-slate-400">{new Date(match.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className="text-xs text-slate-500 group-hover:text-primary-400 transition-colors">View →</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const UsageMeter = ({ icon, label, used, limit, plan }) => {
    const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
    const nearLimit = pct >= 80;
    return (
        <div className="card">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400">{icon}</span>
                <span className="text-sm font-medium text-slate-300">{label}</span>
                {plan === "premium" && <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs">Unlimited</span>}
            </div>
            {plan === "free" ? (
                <>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-white font-semibold">{used} / {limit}</span>
                        <span className={nearLimit ? "text-red-400" : "text-slate-400"}>{Math.round(pct)}% used</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${nearLimit ? "bg-red-400" : "bg-gradient-to-r from-primary-500 to-violet-500"}`}
                            style={{ width: `${pct}%` }} />
                    </div>
                </>
            ) : (
                <p className="text-2xl font-bold text-white">{used} <span className="text-sm text-slate-400 font-normal">this month</span></p>
            )}
        </div>
    );
};

const ScoreBadge = ({ score }) => {
    const color = score >= 70 ? "text-emerald-400 bg-emerald-400/10" : score >= 40 ? "text-amber-400 bg-amber-400/10" : "text-red-400 bg-red-400/10";
    return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${color}`}>
            {score}%
        </div>
    );
};
