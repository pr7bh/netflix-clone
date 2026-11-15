import { create } from "zustand";

export const useProfileStore = create((set) => ({
	activeProfile: null,

	setActiveProfile: (profile) => {
		if (profile) {
			try {
				localStorage.setItem("activeProfileId", profile._id);
			} catch { /* storage unavailable */ }
		}
		set({ activeProfile: profile });
	},

	clearActiveProfile: () => {
		try {
			localStorage.removeItem("activeProfileId");
		} catch { /* storage unavailable */ }
		set({ activeProfile: null });
	},
}));
