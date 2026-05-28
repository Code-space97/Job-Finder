/**
 * context/AuthContext.jsx - Global authentication state using React Context.
 */
import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("jm_user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Validate token on mount
        const token = localStorage.getItem("jm_token");
        if (token) {
            api.get("/auth/me")
                .then((res) => setUser(res.data.user))
                .catch(() => { localStorage.removeItem("jm_token"); localStorage.removeItem("jm_user"); setUser(null); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token, userData) => {
        localStorage.setItem("jm_token", token);
        localStorage.setItem("jm_user", JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("jm_token");
        localStorage.removeItem("jm_user");
        setUser(null);
    };

    const updateUser = (userData) => {
        localStorage.setItem("jm_user", JSON.stringify({ ...user, ...userData }));
        setUser((prev) => ({ ...prev, ...userData }));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
