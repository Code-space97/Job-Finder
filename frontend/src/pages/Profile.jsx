import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { User, MapPin, Briefcase, FileText, Save } from "lucide-react";

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({ name: "", title: "", location: "", bio: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                title: user.title || "",
                location: user.location || "",
                bio: user.bio || "",
            });
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.patch("/user/profile", form);
            updateUser(data.user);
            toast.success("Profile updated!");
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to save profile.");
        } finally {
            setLoading(false);
        }
    };

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-white">
                Your Profile
            </motion.h1>

            {/* Avatar + plan badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {initials}
                </div>
                <div>
                    <p className="text-lg font-semibold text-white">{user?.name}</p>
                    <p className="text-sm text-slate-400">{user?.email}</p>
                    <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${user?.plan === "premium" ? "bg-amber-400/20 text-amber-300" : "bg-primary-500/20 text-primary-300"}`}>
                        {user?.plan === "premium" ? "⭐ Premium" : "Free Plan"}
                    </span>
                </div>
            </motion.div>

            {/* Edit form */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
                <h2 className="text-base font-semibold text-white mb-5">Edit Info</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="label flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Full Name</label>
                        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="label flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />Job Title</label>
                        <input className="input" placeholder="e.g. Full Stack Developer" value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div>
                        <label className="label flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Location</label>
                        <input className="input" placeholder="e.g. San Francisco, CA" value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </div>
                    <div>
                        <label className="label flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Bio</label>
                        <textarea className="input min-h-[100px] resize-y" placeholder="A short bio about yourself..." value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} />
                        <p className="text-xs text-slate-500 mt-1 text-right">{form.bio.length}/500</p>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
