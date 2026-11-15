import axios from "axios";
import toast from "react-hot-toast";
import { create } from "zustand";

export const useUserDataStore = create((set, get) => ({
	myList: [],
	continueWatching: [],

	// ─── Watchlist ──────────────────────────────────────────────────────────────

	fetchWatchlist: async (profileId) => {
		try {
			const res = await axios.get(`/api/v1/user/profiles/${profileId}/watchlist`);
			set({ myList: res.data.myList });
		} catch (_err) { /* silent – list stays empty */ }
	},

	addToWatchlist: async (profileId, item) => {
		try {
			await axios.post(`/api/v1/user/profiles/${profileId}/watchlist`, item);
			set((state) => ({ myList: [...state.myList, { ...item, addedAt: new Date() }] }));
			toast.success("Added to My List");
		} catch (error) {
			if (error.response?.status === 409) {
				toast.error("Already in your list");
			} else {
				toast.error("Failed to add to list");
			}
		}
	},

	removeFromWatchlist: async (profileId, contentId) => {
		try {
			await axios.delete(`/api/v1/user/profiles/${profileId}/watchlist/${contentId}`);
			set((state) => ({ myList: state.myList.filter((i) => i.id !== contentId) }));
			toast.success("Removed from My List");
		} catch (_err) {
			toast.error("Failed to remove from list");
		}
	},

	isInWatchlist: (contentId) => get().myList.some((i) => i.id === contentId),

	// ─── Continue Watching ───────────────────────────────────────────────────────

	fetchContinueWatching: async (profileId) => {
		try {
			const res = await axios.get(`/api/v1/user/profiles/${profileId}/continue-watching`);
			set({ continueWatching: res.data.continueWatching });
		} catch (_err) { /* silent – list stays empty */ }
	},

	updateProgress: async (profileId, item) => {
		try {
			const res = await axios.post(
				`/api/v1/user/profiles/${profileId}/continue-watching`,
				item
			);
			if (res.data.completed) {
				set((state) => ({
					continueWatching: state.continueWatching.filter((i) => i.id !== item.id),
				}));
			} else if (!res.data.skipped) {
				set((state) => {
					const exists = state.continueWatching.find((i) => i.id === item.id);
					if (exists) {
						return {
							continueWatching: state.continueWatching.map((i) =>
								i.id === item.id ? { ...i, ...item, updatedAt: new Date() } : i
							),
						};
					}
					return {
						continueWatching: [
							{ ...item, updatedAt: new Date() },
							...state.continueWatching,
						],
					};
				});
			}
		} catch (_err) { /* progress save failed silently */ }
	},

	removeFromContinueWatching: async (profileId, contentId) => {
		try {
			await axios.delete(
				`/api/v1/user/profiles/${profileId}/continue-watching/${contentId}`
			);
			set((state) => ({
				continueWatching: state.continueWatching.filter((i) => i.id !== contentId),
			}));
		} catch (_err) { /* silent */ }
	},

	getSavedProgress: (contentId) => {
		const item = get().continueWatching.find((i) => i.id === contentId);
		return item ? { progress: item.progress, trailerKey: item.trailerKey } : null;
	},
}));
