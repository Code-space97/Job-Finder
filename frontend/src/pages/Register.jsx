import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Zap, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
        setLoading(true);
        try {
            const { data } = await api.post("/auth/register", form);
            login(data.token, data.user);
            toast.success("Account created! Welcome to JobMatcher 🎉");
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex w-12 h-12 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl items-center justify-center mb-4">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create your account</h1>
                    <p className="text-slate-400 mt-1">Free tier included — no credit card needed</p>
                </div>

                <div className="card">
                    {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Full Name</label>
                            <input type="text" className="input" placeholder="John Doe" value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input type="email" className="input" placeholder="you@example.com" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input type={showPw ? "text" : "password"} className="input pr-10" placeholder="Min. 6 characters" value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3.5 text-slate-400 hover:text-white">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Account"}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-400 mt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
