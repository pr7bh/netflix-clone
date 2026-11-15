import express from "express";
import {
	getProfiles,
	createProfile,
	updateProfile,
	deleteProfile,
	getWatchlist,
	addToWatchlist,
	removeFromWatchlist,
	getContinueWatching,
	updateContinueWatching,
	removeFromContinueWatching,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profiles", getProfiles);
router.post("/profiles", createProfile);
router.put("/profiles/:profileId", updateProfile);
router.delete("/profiles/:profileId", deleteProfile);

router.get("/profiles/:profileId/watchlist", getWatchlist);
router.post("/profiles/:profileId/watchlist", addToWatchlist);
router.delete("/profiles/:profileId/watchlist/:contentId", removeFromWatchlist);

router.get("/profiles/:profileId/continue-watching", getContinueWatching);
router.post("/profiles/:profileId/continue-watching", updateContinueWatching);
router.delete("/profiles/:profileId/continue-watching/:contentId", removeFromContinueWatching);

export default router;
