/**
 * lib/api.js - Axios instance with JWT interceptors for the Job Matcher API.
 */
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("jm_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-clear auth if the token is expired/invalid
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("jm_token");
            localStorage.removeItem("jm_user");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

export default api;
