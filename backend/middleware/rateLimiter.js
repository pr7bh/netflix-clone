import rateLimit from "express-rate-limit";

const handler = (req, res) =>
	res.status(429).json({ success: false, message: "Too many requests. Please slow down." });

// Auth: 15 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 15,
	standardHeaders: true,
	legacyHeaders: false,
	handler,
});

// TMDB proxy: 120 requests per minute per IP
export const tmdbLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 120,
	standardHeaders: true,
	legacyHeaders: false,
	handler,
});

// General API: 300 requests per minute per IP
export const generalLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
	handler,
});
