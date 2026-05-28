import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Zap, User, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const handleLogout = () => { logout(); navigate("/"); };
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass-nav sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg gradient-text">JobMatcher</span>
                </Link>

                {/* Desktop Nav */}
                {user ? (
                    <div className="hidden md:flex items-center gap-2">
                        <NavLink to="/dashboard" active={isActive("/dashboard")} icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavLink>
                        <NavLink to="/match" active={isActive("/match")} icon={<Zap className="w-4 h-4" />}>New Match</NavLink>
                        <NavLink to="/profile" active={isActive("/profile")} icon={<User className="w-4 h-4" />}>Profile</NavLink>
                        <button onClick={handleLogout} className="ml-2 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-3">
                        <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2">Login</Link>
                        <Link to="/register" className="btn-primary text-sm">Get Started</Link>
                    </div>
                )}

                {/* Mobile toggle */}
                <button className="md:hidden p-2 rounded-lg hover:bg-white/10" onClick={() => setOpen(!open)}>
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="md:hidden border-t border-white/10 px-4 pb-4 space-y-1">
                    {user ? (
                        <>
                            <MobileLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
                            <MobileLink to="/match" onClick={() => setOpen(false)}>New Match</MobileLink>
                            <MobileLink to="/profile" onClick={() => setOpen(false)}>Profile</MobileLink>
                            <button onClick={() => { handleLogout(); setOpen(false); }} className="w-full text-left text-slate-400 px-3 py-2 text-sm hover:text-white">Logout</button>
                        </>
                    ) : (
                        <>
                            <MobileLink to="/login" onClick={() => setOpen(false)}>Login</MobileLink>
                            <MobileLink to="/register" onClick={() => setOpen(false)}>Get Started</MobileLink>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}

const NavLink = ({ to, active, icon, children }) => (
    <Link to={to} className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-all duration-200 ${active ? "bg-primary-600/20 text-primary-400" : "text-slate-400 hover:text-white hover:bg-white/10"}`}>
        {icon}{children}
    </Link>
);

const MobileLink = ({ to, onClick, children }) => (
    <Link to={to} onClick={onClick} className="block text-slate-300 hover:text-white px-3 py-2 text-sm rounded-lg hover:bg-white/10">{children}</Link>
);
