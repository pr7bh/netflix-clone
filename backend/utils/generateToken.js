import jwt from "jsonwebtoken";
import { ENV_VARS } from "../config/envVars.js";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: "15d" });

	const isProd = ENV_VARS.NODE_ENV === "production";
	res.cookie("jwt-netflix", token, {
		maxAge: 15 * 24 * 60 * 60 * 1000,
		httpOnly: true,
		// Cross-origin (Vercel frontend → Render backend) requires sameSite:"none" + secure:true.
		// In dev the Vite proxy makes calls same-origin, so "strict" works fine.
		sameSite: isProd ? "none" : "strict",
		secure: isProd,
	});

	return token;
};
