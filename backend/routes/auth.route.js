import express from "express";
import { authCheck, login, logout, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { authLimiter, generalLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Strict limit only on mutation endpoints, not authCheck
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", generalLimiter, logout);

router.get("/authCheck", generalLimiter, protectRoute, authCheck);

export default router;
