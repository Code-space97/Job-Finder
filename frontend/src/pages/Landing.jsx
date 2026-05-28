import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Upload, BarChart3, Sparkles, ArrowRight, Shield, Clock } from "lucide-react";

export default function Landing() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden px-4 pt-20 pb-32 text-center">
                {/* Background glow */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-600/20 rounded-full blur-[120px]" />
                </div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6">
                        <Sparkles className="w-3.5 h-3.5" /> AI-powered job matching
                    </span>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                        Match Your Resume<br />
                        <span className="gradient-text">Perfectly.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        Upload your resume, paste a job description, and get an instant AI-powered match score,
                        skill gap analysis, and personalized recommendations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2">
                            Get Started Free <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/login" className="btn-secondary text-base px-8 py-3.5">
                            Sign In
                        </Link>
                    </div>
                </motion.div>

                {/* Score preview card */}
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                    className="mt-16 max-w-sm mx-auto card text-left">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-slate-400 font-medium">Match Score</span>
                        <span className="text-3xl font-bold gradient-text">87%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                        <div className="bg-gradient-to-r from-primary-500 to-violet-500 h-2 rounded-full" style={{ width: "87%" }} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Matching Skills</p>
                        <div className="flex flex-wrap gap-2">
                            {["React", "Node.js", "TypeScript", "MongoDB"].map(s => (
                                <span key={s} className="px-2.5 py-0.5 bg-primary-500/20 text-primary-300 rounded-full text-xs font-medium">{s}</span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section className="max-w-6xl mx-auto px-4 pb-24">
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { icon: <Upload className="w-5 h-5 text-primary-400" />, title: "Upload Resume", desc: "PDF or DOCX. We extract skills, experience, and education automatically." },
                        { icon: <BarChart3 className="w-5 h-5 text-violet-400" />, title: "Match Score", desc: "TF-IDF + cosine similarity gives you a 0–100% match score instantly." },
                        { icon: <Sparkles className="w-5 h-5 text-pink-400" />, title: "AI Recommendations", desc: "See exactly what skills you're missing and how to fill the gap." },
                    ].map((f, i) => (
                        <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i + 0.4 }} className="card hover:border-white/20 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">{f.icon}</div>
                            <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-400">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Free tier info */}
                <div className="mt-8 card border-primary-500/20 bg-primary-500/5 flex flex-col sm:flex-row gap-6 items-center">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary-400 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white">Free tier included</p>
                            <p className="text-sm text-slate-400">5 resume uploads + 10 job matches per month, no credit card required.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto">
                        <Clock className="w-8 h-8 text-violet-400 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-white">Under 5 seconds</p>
                            <p className="text-sm text-slate-400">Results are instant. No waiting, no queues.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
