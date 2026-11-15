import dotenv from "dotenv";

dotenv.config();

const REQUIRED = ["MONGO_URI", "JWT_SECRET", "TMDB_API_KEY"];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
	console.error(`[startup] Missing required environment variables: ${missing.join(", ")}`);
	console.error("[startup] Copy .env.example to .env and fill in the values.");
	process.exit(1);
}

export const ENV_VARS = {
	MONGO_URI: process.env.MONGO_URI,
	PORT: process.env.PORT || 5000,
	JWT_SECRET: process.env.JWT_SECRET,
	NODE_ENV: process.env.NODE_ENV,
	TMDB_API_KEY: process.env.TMDB_API_KEY,
	FRONTEND_URL: process.env.FRONTEND_URL || "",
};
