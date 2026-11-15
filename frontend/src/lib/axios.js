import axios from "axios";

// In dev, VITE_API_BASE_URL is unset → Vite proxy handles /api/* calls locally.
// In production (Vercel), set VITE_API_BASE_URL to your Render backend URL.
if (import.meta.env.VITE_API_BASE_URL) {
	axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}

// Required for cross-origin requests (Vercel frontend → Render backend) to
// include the httpOnly JWT cookie. Safe to set globally — same-origin dev
// requests send cookies regardless.
axios.defaults.withCredentials = true;
