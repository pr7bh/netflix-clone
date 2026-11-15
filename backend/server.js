import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { existsSync } from "fs";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import movieRoutes from "./routes/movie.route.js";
import tvRoutes from "./routes/tv.route.js";
import searchRoutes from "./routes/search.route.js";
import userRoutes from "./routes/user.route.js";

import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import { protectRoute } from "./middleware/protectRoute.js";
import { tmdbLimiter, generalLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Trust the first proxy (Render, Vercel, Heroku, etc.) so express-rate-limit
// reads the real client IP from X-Forwarded-For instead of the proxy's IP.
app.set("trust proxy", 1);

const PORT = ENV_VARS.PORT;
const __dirname = path.resolve();

// Security headers
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'", "https://www.youtube.com", "https://s.ytimg.com"],
				frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
				imgSrc: ["'self'", "data:", "https://image.tmdb.org", "https://i.ytimg.com", "https://img.youtube.com"],
				mediaSrc: ["'self'", "https://www.youtube.com"],
				connectSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
			},
		},
		crossOriginEmbedderPolicy: false, // required for YouTube iframes
	})
);

// CORS — dev allows Vite dev server; prod allows the Vercel frontend URL
const allowedOrigins =
	ENV_VARS.NODE_ENV === "production"
		? ENV_VARS.FRONTEND_URL ? [ENV_VARS.FRONTEND_URL] : []
		: ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
	cors({
		origin: (origin, cb) => {
			// allow same-origin / non-browser requests (server-to-server, curl, tests)
			if (!origin) return cb(null, true);
			if (allowedOrigins.includes(origin)) return cb(null, true);
			cb(new Error(`CORS: origin ${origin} not allowed`));
		},
		credentials: true,
	})
);

app.use(express.json());
app.use(cookieParser());

// Health check — no auth, no rate limit
app.get("/api/health", async (_req, res) => {
	const { connection } = await import("mongoose");
	const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
	res.json({
		status: "ok",
		db: dbState[connection.readyState] ?? "unknown",
		uptime: Math.floor(process.uptime()),
	});
});

app.use("/api/v1/auth", authRoutes); // per-route limiting applied inside auth.route.js
app.use("/api/v1/movie", protectRoute, tmdbLimiter, movieRoutes);
app.use("/api/v1/tv", protectRoute, tmdbLimiter, tvRoutes);
app.use("/api/v1/search", protectRoute, tmdbLimiter, searchRoutes);
app.use("/api/v1/user", protectRoute, generalLimiter, userRoutes);

if (ENV_VARS.NODE_ENV === "production") {
	const distPath = path.join(__dirname, "frontend", "dist");
	if (existsSync(distPath)) {
		app.use(express.static(distPath));
		app.get("*", (req, res) => {
			res.sendFile(path.join(distPath, "index.html"));
		});
	}
}

app.listen(PORT, () => {
	console.log("Server started at http://localhost:" + PORT);
	connectDB();
});


