import { User } from "../models/user.model.js";

const PROFILE_LIMIT = 5;
const PROFILE_AVATARS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfiles(req, res) {
	try {
		res.json({ success: true, profiles: req.user.profiles });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

export async function createProfile(req, res) {
	try {
		const { name, avatar, isKids } = req.body;
		if (!name?.trim()) {
			return res.status(400).json({ success: false, message: "Profile name is required" });
		}

		const user = await User.findById(req.user._id);
		if (user.profiles.length >= PROFILE_LIMIT) {
			return res
				.status(400)
				.json({ success: false, message: `Maximum ${PROFILE_LIMIT} profiles allowed` });
		}

		user.profiles.push({
			name: name.trim(),
			avatar: PROFILE_AVATARS.includes(avatar) ? avatar : "/avatar1.png",
			isKids: Boolean(isKids),
		});
		await user.save();

		res.status(201).json({ success: true, profiles: user.profiles });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

export async function updateProfile(req, res) {
	try {
		const { profileId } = req.params;
		const { name, avatar, isKids } = req.body;

		const user = await User.findById(req.user._id);
		const profile = user.profiles.id(profileId);
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		if (name?.trim()) profile.name = name.trim();
		if (PROFILE_AVATARS.includes(avatar)) profile.avatar = avatar;
		if (isKids !== undefined) profile.isKids = Boolean(isKids);

		await user.save();
		res.json({ success: true, profiles: user.profiles });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

export async function deleteProfile(req, res) {
	try {
		const { profileId } = req.params;
		const user = await User.findById(req.user._id);

		if (user.profiles.length <= 1) {
			return res
				.status(400)
				.json({ success: false, message: "Cannot delete the last profile" });
		}

		const profile = user.profiles.id(profileId);
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		profile.deleteOne();
		await user.save();
		res.json({ success: true, profiles: user.profiles });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function getWatchlist(req, res) {
	try {
		const { profileId } = req.params;
		const profile = req.user.profiles.id(profileId);
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}
		res.json({ success: true, myList: profile.myList });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

export async function addToWatchlist(req, res) {
	try {
		const { profileId } = req.params;
		const { id, title, image, contentType } = req.body;

		if (!id || !title || !contentType) {
			return res
				.status(400)
				.json({ success: false, message: "id, title, and contentType are required" });
		}

		const user = await User.findById(req.user._id);
		const profile = user.profiles.id(profileId);
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		if (profile.myList.some((item) => item.id === Number(id))) {
			return res.status(409).json({ success: false, message: "Already in watchlist" });
		}

		profile.myList.push({ id: Number(id), title, image, contentType });
		await user.save();
		res.status(201).json({ success: true, myList: profile.myList });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

export async function removeFromWatchlist(req, res) {
	try {
		const { profileId, contentId } = req.params;
		const user = await User.findById(req.user._id);
		const profile = user.profiles.id(profileId);
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		profile.myList = profile.myList.filter((item) => item.id !== Number(contentId));
		await user.save();
		res.json({ success: true, myList: profile.myList });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

// ─── Continue Watching ────────────────────────────────────────────────────────

export async function getContinueWatching(req, res) {
	try {
		const { profileId } = req.params;
		const profile = req.user.profiles.id(profileId);
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		const sorted = [...profile.continueWatching].sort(
			(a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
		);
		res.json({ success: true, continueWatching: sorted });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

export async function updateContinueWatching(req, res) {
	try {
		const { profileId } = req.params;
		const { id, title, image, contentType, trailerKey, progress, duration } = req.body;

		if (!id || !title || !contentType || progress === undefined) {
			return res.status(400).json({
				success: false,
				message: "id, title, contentType, and progress are required",
			});
		}

		const user = await User.findById(req.user._id);
		const profile = user.profiles.id(profileId);
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		// Treat as completed when >95% watched
		if (duration > 0 && progress / duration > 0.95) {
			profile.continueWatching = profile.continueWatching.filter(
				(item) => item.id !== Number(id)
			);
			await user.save();
			return res.json({ success: true, completed: true });
		}

		const existing = profile.continueWatching.find((item) => item.id === Number(id));

		if (existing) {
			existing.progress = progress;
			if (duration) existing.duration = duration;
			if (trailerKey) existing.trailerKey = trailerKey;
			existing.updatedAt = new Date();
		} else {
			// Don't track the first few seconds of a play
			if (progress < 5) {
				return res.json({ success: true, skipped: true });
			}
			profile.continueWatching.push({
				id: Number(id),
				title,
				image,
				contentType,
				trailerKey,
				progress,
				duration: duration || 0,
			});
		}

		await user.save();
		res.json({ success: true });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}

export async function removeFromContinueWatching(req, res) {
	try {
		const { profileId, contentId } = req.params;
		const user = await User.findById(req.user._id);
		const profile = user.profiles.id(profileId);
		if (!profile) {
			return res.status(404).json({ success: false, message: "Profile not found" });
		}

		profile.continueWatching = profile.continueWatching.filter(
			(item) => item.id !== Number(contentId)
		);
		await user.save();
		res.json({ success: true });
	} catch (error) {
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
}
